import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = (redisUrl && redisToken)
  ? new Redis({
      url: redisUrl,
      token: redisToken,
    })
  : null;

export async function POST(req: Request) {
  try {
    const city = req.headers.get('x-vercel-ip-city');
    const edge = req.headers.get('x-vercel-id'); // e.g., hnd1::randomstr
    
    // Map of Vercel Edge Server codes to real-world cyber-sectors
    const EDGE_CITY_MAP: Record<string, string> = {
      hnd1: "TOKYO", nrt1: "TOKYO", kix1: "OSAKA",
      arn1: "STOCKHOLM",
      sfo1: "SAN FRANCISCO", jfk1: "NEW YORK", iad1: "WASHINGTON DC",
      icn1: "SEOUL", sin1: "SINGAPORE", syd1: "SYDNEY",
      lhr1: "LONDON", cdg1: "PARIS", fra1: "FRANKFURT"
    };

    let resolvedCity = "UNKNOWN";
    if (city && !city.toUpperCase().includes('SPC')) {
      resolvedCity = decodeURIComponent(city).toUpperCase();
    } else if (edge) {
      const edgeCode = edge.split('::')[0].toLowerCase();
      resolvedCity = EDGE_CITY_MAP[edgeCode] || edgeCode.toUpperCase();
    }

    const region = resolvedCity.replace(/[^a-zA-Z0-9_ -]/g, '').toUpperCase() || "UNKNOWN SECTOR";
    if (!redis) {
      // Offline fallback
      return NextResponse.json({ 
        visitorNumber: Math.floor(Math.random() * 1000),
        areaStress: Math.floor(Math.random() * 300),
        region: region
      });
    }

    const body = await req.json().catch(() => ({}));
    const isReturning = !!body?.isReturning;

    // Atomic increments using Redis pipeline for speed
    const p = redis.pipeline();
    if (isReturning) {
      p.get('global_visitor_count');
    } else {
      p.incr('global_visitor_count');
    }
    p.incr(`area_stress:${region}`);
    
    const results = await p.exec();
    
    const visitorNumber = parseInt(results[0] as string, 10) || 0;
    const areaStress = parseInt(results[1] as string, 10) || 0;

    return NextResponse.json({ visitorNumber, areaStress, region });
  } catch (error) {
    console.error('Error in scanning process:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

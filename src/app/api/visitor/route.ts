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
    // Attempt to retrieve city from Vercel's IP Geolocation headers
    // Fallback to "UNKNOWN_SECTOR" for local dev or missing headers
    const rawCity = req.headers.get('x-vercel-ip-city') || 'UNKNOWN_SECTOR';
    const region = rawCity.replace(/[^a-zA-Z0-9_ -]/g, '').toUpperCase();

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

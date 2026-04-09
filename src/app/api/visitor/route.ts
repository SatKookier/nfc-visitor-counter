import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
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

    // Atomic increments using Redis pipeline for speed
    const p = redis.pipeline();
    p.incr('global_visitor_count');
    p.incr(`area_stress:${region}`);
    
    const results = await p.exec();
    
    // results[0] = global count, results[1] = area stress count
    const [visitorNumber, areaStress] = results as [number, number];

    return NextResponse.json({ visitorNumber, areaStress, region });
  } catch (error) {
    console.error('Error in scanning process:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

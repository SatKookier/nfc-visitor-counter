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
    
    if (edge) {
      // Primary Sector Rule: ALWAYS group by major server edge (e.g. all of Kanto/East Japan -> TOKYO)
      const edgeCode = edge.split('::')[0].toLowerCase();
      resolvedCity = EDGE_CITY_MAP[edgeCode] || edgeCode.toUpperCase();
    } else if (city) {
      // Fallback only if edge is completely unavailable
      resolvedCity = decodeURIComponent(city).toUpperCase();
    }

    // Allow standard alphanumeric and European Latin-1 accented characters (like å, ä, ö, é, etc.)
    const region = resolvedCity.replace(/[^a-zA-Z0-9_\u00C0-\u017F -]/g, '').toUpperCase() || "UNKNOWN SECTOR";
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

    // Trigger Telegram Alert asynchronously if this is a NEW entity
    if (!isReturning && process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      const userAgent = (req.headers.get('user-agent') || '').toLowerCase();
      
      // Detailed UA Analysis
      const isMobile = /mobile|android|ip(hone|od|ad)|blackberry|iemobile|silk/i.test(userAgent);
      const hardware = isMobile ? 'Mobile/Tablet' : 'Desktop/PC';
      
      let os = "Unknown OS";
      if (userAgent.includes('windows')) os = 'Windows';
      else if (userAgent.includes('mac os x')) os = isMobile ? 'Apple iOS' : 'Apple macOS';
      else if (userAgent.includes('android')) os = 'Android';
      else if (userAgent.includes('linux')) os = 'Linux';

      let browser = "Unknown Browser";
      let isAnomalous = false;

      // Detect Identity/Privacy Browsers & In-App Viewers
      if (userAgent.includes('twitter') || userAgent.includes('fban') || userAgent.includes('line')) {
        browser = 'In-App Browser (SNS)';
        isAnomalous = true; // Secondary link tracing
      } else if (userAgent.includes('duckduckgo') || userAgent.includes('fxios') || userAgent.includes('edgios')) {
        browser = 'Privacy/Proxy Browser';
        isAnomalous = true; // Identity obfuscation
      } else if (userAgent.includes('edg/')) browser = 'Microsoft Edge';
      else if (userAgent.includes('crios/') || userAgent.includes('chrome/')) browser = 'Google Chrome';
      else if (userAgent.includes('safari/') && !userAgent.includes('chrome/')) browser = 'Apple Safari';
      else if (userAgent.includes('firefox/')) browser = 'Mozilla Firefox';

      // Desktop access from an NFC tag is inherently anomalous
      if (!isMobile && (os === 'Windows' || os === 'Apple macOS' || os === 'Linux')) {
        isAnomalous = true;
      }

      const threatLevel = isAnomalous ? "🟥 LETHAL ELIMINATOR" : "🟦 NON-LETHAL PARALYZER";
      const operationStatus = isAnomalous ? "WARNING: Irregular access vector detected." : "System operation normal.";

      const telegramMsg = `
🚨 [ NEW ENTITY DETECTED ] 🚨
============================
▶ SECTOR: ${region}
▶ THREAT LEVEL: ${threatLevel}
▶ OS: ${os}
▶ BROWSER: ${browser}
▶ HARDWARE: ${hardware}
▶ VISITOR COEFFICIENT: ${visitorNumber.toString().padStart(3, '0')}
============================
${operationStatus}
      `.trim();

      // Await the fetch to ensure Vercel doesn't kill the serverless function prematurely
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: telegramMsg,
        })
      }).catch(err => console.error("Telegram Error:", err));
    }

    return NextResponse.json({ visitorNumber, areaStress, region });
  } catch (error) {
    console.error('Error in scanning process:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

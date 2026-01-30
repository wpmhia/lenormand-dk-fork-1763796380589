import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
});

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("forwarded");
  if (forwarded) {
    const forMatch = forwarded.match(/for=([^;,;\s]+)/i);
    if (forMatch && forMatch[1]) {
      return forMatch[1].replace(/"/g, "");
    }
  }

  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }

  const cfConnectingIP = request.headers.get("cf-connecting-ip");
  if (cfConnectingIP) return cfConnectingIP;

  return request.ip || "127.0.0.1";
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/data") ||
    pathname.startsWith("/favicon") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".webp") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".js") ||
    pathname.endsWith(".woff") ||
    pathname.endsWith(".woff2")
  ) {
    const response = NextResponse.next();
    
    if (pathname.startsWith("/_next") || pathname.endsWith(".js") || pathname.endsWith(".css") || pathname.endsWith(".woff")) {
      response.headers.set("Cache-Control", "public, max-age=31536000, immutable");
    } else if (pathname.startsWith("/images") || pathname.endsWith(".png")) {
      response.headers.set("Cache-Control", "public, max-age=2592000, stale-while-revalidate=86400");
    }
    
    return response;
  }

  const ip = getClientIP(request);
  const response = NextResponse.next();

  if (pathname.startsWith("/api/")) {
    const { success } = await ratelimit.limit(ip);
    
    if (!success) {
      return new NextResponse(
        JSON.stringify({ error: "Rate limit exceeded" }),
        { 
          status: 429, 
          headers: { 
            "Content-Type": "application/json",
            "Retry-After": "60"
          } 
        }
      );
    }
  }

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=(), payment=(), usb=()");

  const hostname = request.nextUrl.hostname;
  const isVercel = hostname.includes("vercel.app");
  
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://www.googletagmanager.com${isVercel ? " https://*.vercel.app" : ""}`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com${isVercel ? " https://*.vercel.app" : ""}`,
    `font-src 'self' https://fonts.gstatic.com${isVercel ? " https://*.vercel.app" : ""}`,
    "img-src 'self' data: https: blob:",
    `connect-src 'self' https: wss:${isVercel ? " https://*.vercel.app" : ""}`,
    "frame-ancestors *",
    "base-uri 'self'",
    "form-action 'self'"
  ].join("; ");
  
  response.headers.set("Content-Security-Policy", csp);

  const ALLOWED_ORIGINS = [
    "https://lenormand.dk",
    "https://www.lenormand.dk",
    "https://lenormand-intelligence.vercel.app",
  ];
  const origin = request.headers.get("origin");
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }
  response.headers.set("Access-Control-Allow-Methods", "GET, POST");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");

  response.headers.delete("server");

  return response;
}

export const config = {
  matcher: ["/:path*"],
};
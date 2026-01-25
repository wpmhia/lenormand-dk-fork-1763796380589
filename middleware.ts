import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastAccess: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 100;
const MAX_MAP_SIZE = 5000;

function cleanupOldEntries() {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  
  // Clean up expired entries and enforce size limit
  for (const [key, entry] of rateLimitMap.entries()) {
    if (entry.resetTime < now || entry.lastAccess < cutoff) {
      rateLimitMap.delete(key);
    }
  }
  
  // If still too large, remove oldest entries
  if (rateLimitMap.size > MAX_MAP_SIZE) {
    const entries = Array.from(rateLimitMap.entries())
      .sort((a, b) => a[1].lastAccess - b[1].lastAccess);
    
    const toDelete = entries.slice(0, rateLimitMap.size - MAX_MAP_SIZE);
    toDelete.forEach(([key]) => rateLimitMap.delete(key));
  }
}

function getValidClientIP(request: NextRequest): string {
  // Try to get real IP, fallback to safe defaults
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim());
    const realIP = ips[0];
    // Basic validation - reject obvious invalid IPs
    if (realIP && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(realIP)) {
      return realIP;
    }
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(realIP)) {
    return realIP;
  }
  
  // Fallback to request.ip or generate a safe hash
  const ip = request.ip || 'unknown';
  
  // For unknown IPs, hash to prevent tracking
  if (ip === 'unknown') {
    const userAgent = request.headers.get('user-agent') || '';
    const combined = ip + userAgent;
    // Simple hash for rate limiting purposes
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `hash-${Math.abs(hash)}`;
  }
  
  return ip;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/data') ||
    pathname.startsWith('/favicon') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.webp')
  ) {
    return NextResponse.next();
  }

  const ip = getValidClientIP(request);
  const now = Date.now();

  cleanupOldEntries();

  const record = rateLimitMap.get(ip);
  if (record) {
    record.lastAccess = now;
  }

  if (record && record.resetTime > now) {
    if (record.count >= MAX_REQUESTS) {
      return new NextResponse("Too Many Requests", { status: 429 });
    }
    record.count++;
  } else {
    rateLimitMap.set(ip, { 
      count: 1, 
      resetTime: now + WINDOW_MS,
      lastAccess: now 
    });
  }

  const response = NextResponse.next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()",
  );
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  response.headers.set("X-RateLimit-Limit", String(MAX_REQUESTS));
  response.headers.set(
    "X-RateLimit-Remaining",
    String(Math.max(0, MAX_REQUESTS - (record?.count || 1))),
  );
  response.headers.set(
    "X-RateLimit-Reset",
    String(Math.ceil((record?.resetTime || now + WINDOW_MS) / 1000)),
  );

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }

  return response;
}

export const config = {
  matcher: ["/:path*"],
};

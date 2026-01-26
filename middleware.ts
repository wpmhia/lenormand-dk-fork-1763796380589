import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastAccess: number;
}

// Industry standard rate limiting configuration
const rateLimitMap = new Map<string, RateLimitEntry>();
const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 60; // Industry standard: 60 requests per minute
const MAX_MAP_SIZE = 10000; // Reasonable memory limit
const CLEANUP_INTERVAL = 5 * 60 * 1000; // Cleanup every 5 minutes
let lastCleanup = Date.now();

// Industry standard IP extraction with comprehensive headers
function getClientIP(request: NextRequest): string {
  // Order of preference for client IP detection (RFC 7239 and common practices)
  const forwarded = request.headers.get('forwarded');
  if (forwarded) {
    // Parse Forwarded header: Forwarded: for=192.0.2.60;proto=http;by=203.0.113.43
    const forMatch = forwarded.match(/for=([^;,;\s]+)/i);
    if (forMatch && forMatch[1]) {
      const ip = forMatch[1].replace(/"/g, '');
      if (isValidIP(ip)) return ip;
    }
  }

  // X-Forwarded-For header (most common)
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const ips = xForwardedFor.split(',').map(ip => ip.trim());
    // Take the leftmost IP (original client)
    const clientIP = ips[0];
    if (isValidIP(clientIP)) return clientIP;
  }

  // X-Real-IP header (Nginx, AWS ALB)
  const xRealIP = request.headers.get('x-real-ip');
  if (xRealIP && isValidIP(xRealIP)) {
    return xRealIP;
  }

  // X-Client-IP header (Apache)
  const xClientIP = request.headers.get('x-client-ip');
  if (xClientIP && isValidIP(xClientIP)) {
    return xClientIP;
  }

  // CF-Connecting-IP header (Cloudflare)
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP && isValidIP(cfConnectingIP)) {
    return cfConnectingIP;
  }

  // True-Client-IP header (Akamai)
  const trueClientIP = request.headers.get('true-client-ip');
  if (trueClientIP && isValidIP(trueClientIP)) {
    return trueClientIP;
  }

  // Fallback to request.ip (Next.js provides this)
  if (request.ip && isValidIP(request.ip)) {
    return request.ip;
  }

  // Generate a secure hash for completely unknown clients
  return generateSecureIPHash(request);
}

function isValidIP(ip: string): boolean {
  if (!ip || ip.length === 0) return false;
  
  // IPv4 validation
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  if (ipv4Regex.test(ip)) return true;
  
  // IPv6 validation (basic)
  const ipv6Regex = /^(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}$/i;
  const ipv6ShortRegex = /^(?:[A-F0-9]{1,4}:){1,7}:$/i;
  const ipv6CompressedRegex = /^(?:[A-F0-9]{1,4}:)*::(?:[A-F0-9]{1,4}:)*[A-F0-9]{1,4}$/i;
  
  return ipv6Regex.test(ip) || ipv6ShortRegex.test(ip) || ipv6CompressedRegex.test(ip);
}

function generateSecureIPHash(request: NextRequest): string {
  const userAgent = request.headers.get('user-agent') || '';
  const acceptLanguage = request.headers.get('accept-language') || '';
  const accept = request.headers.get('accept') || '';
  
  // Combine various headers for a more unique identifier
  const combined = `unknown:${userAgent}:${acceptLanguage}:${accept}`;
  
  // Simple hash function that works in edge runtime (Web API)
  // This is sufficient for rate limiting purposes
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0; // Use bitwise OR to convert to 32-bit integer
  }
  
  return `anon-${Math.abs(hash).toString(16)}`; // Use hex for better distribution
}

function cleanupOldEntries(): void {
  const now = Date.now();
  
  // Only cleanup if enough time has passed
  if (now - lastCleanup < CLEANUP_INTERVAL) {
    return;
  }
  
  lastCleanup = now;
  const cutoff = now - WINDOW_MS;
  
  // Clean up expired entries
  for (const [key, entry] of rateLimitMap.entries()) {
    if (entry.resetTime < now || entry.lastAccess < cutoff) {
      rateLimitMap.delete(key);
    }
  }
  
  // Enforce size limit with LRU eviction
  if (rateLimitMap.size > MAX_MAP_SIZE) {
    const entries = Array.from(rateLimitMap.entries())
      .sort((a, b) => a[1].lastAccess - b[1].lastAccess);
    
    const toDelete = entries.slice(0, rateLimitMap.size - MAX_MAP_SIZE);
    toDelete.forEach(([key]) => rateLimitMap.delete(key));
  }
}

export function middleware(request: NextRequest) {
   const pathname = request.nextUrl.pathname;

   // Skip rate limiting for static assets and internal routes
   if (
     pathname.startsWith('/_next') ||
     pathname.startsWith('/images') ||
     pathname.startsWith('/data') ||
     pathname.startsWith('/favicon') ||
     pathname.startsWith('/api/health') ||
     pathname.endsWith('.ico') ||
     pathname.endsWith('.png') ||
     pathname.endsWith('.jpg') ||
     pathname.endsWith('.jpeg') ||
     pathname.endsWith('.svg') ||
     pathname.endsWith('.webp') ||
     pathname.endsWith('.css') ||
     pathname.endsWith('.js') ||
     pathname.endsWith('.woff') ||
     pathname.endsWith('.woff2')
   ) {
     const staticResponse = NextResponse.next();
     
     // Add Cache-Control headers for static assets
     if (pathname.startsWith('/_next') || pathname.endsWith('.js') || pathname.endsWith('.css') || pathname.endsWith('.woff') || pathname.endsWith('.woff2')) {
       // Cache Next.js and font assets for 1 year (immutable)
       staticResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
     } else if (pathname.startsWith('/images') || pathname.endsWith('.png') || pathname.endsWith('.jpg') || pathname.endsWith('.jpeg') || pathname.endsWith('.svg') || pathname.endsWith('.webp')) {
       // Cache images for 30 days
       staticResponse.headers.set('Cache-Control', 'public, max-age=2592000, stale-while-revalidate=86400');
     } else {
       // Cache other static assets for 7 days
       staticResponse.headers.set('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
     }
     
     return staticResponse;
   }

  const ip = getClientIP(request);
  const now = Date.now();

  cleanupOldEntries();

  const record = rateLimitMap.get(ip);
  
  if (record && record.resetTime > now) {
    // Within the current window
    if (record.count >= MAX_REQUESTS) {
      // Rate limit exceeded - return industry standard 429 response
      return new NextResponse(
        JSON.stringify({
          error: "Too Many Requests",
          message: "Rate limit exceeded. Please try again later.",
          retryAfter: Math.ceil((record.resetTime - now) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((record.resetTime - now) / 1000)),
            'X-RateLimit-Limit': String(MAX_REQUESTS),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(record.resetTime / 1000)),
          }
        }
      );
    }
    record.count++;
    if (record) {
      record.lastAccess = now;
    }
  } else {
    // New window
    rateLimitMap.set(ip, { 
      count: 1, 
      resetTime: now + WINDOW_MS,
      lastAccess: now 
    });
  }

  const response = NextResponse.next();
  const currentRecord = rateLimitMap.get(ip);

  // Industry standard security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  // response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()", // More comprehensive
  );
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  
  // Content Security Policy (CSP) - Industry standard with Vercel/e2b deployment support
  const hostname = request.nextUrl.hostname;
  const isVercel = hostname.includes('vercel.app') || hostname.includes('e2b.app');
  
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://vercel.live${isVercel ? ' https://*.vercel.app https://*.e2b.app' : ''}`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com${isVercel ? ' https://*.vercel.app https://*.e2b.app' : ''}`,
    `font-src 'self' https://fonts.gstatic.com${isVercel ? ' https://*.vercel.app https://*.e2b.app' : ''}`,
    "img-src 'self' data: https: blob:",
    `connect-src 'self' https: wss: ${isVercel ? 'https://*.vercel.app https://*.e2b.app wss://*.vercel.app wss://*.e2b.app' : ''}`, // Allow all Vercel/e2b connections
    isVercel ? "frame-ancestors 'self' https://*.e2b.app https://ideavo.ai https://server.ideavo.ai https://4000-*.e2b.app https://38473-*.e2b.app" : "frame-ancestors *", // Allow framing for development
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  
  response.headers.set("Content-Security-Policy", csp);
  
  // Rate limiting headers (industry standard format)
  response.headers.set("X-RateLimit-Limit", String(MAX_REQUESTS));
  response.headers.set(
    "X-RateLimit-Remaining",
    String(Math.max(0, MAX_REQUESTS - (currentRecord?.count || 0))),
  );
  response.headers.set(
    "X-RateLimit-Reset",
    String(Math.ceil((currentRecord?.resetTime || now + WINDOW_MS) / 1000)),
  );

  // HSTS in production (industry standard)
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload", // Added preload for better security
    );
  }

   // Additional industry standard headers (relaxed for deployment environments)
   if (!isVercel) {
     response.headers.set("Cross-Origin-Embedder-Policy", "require-corp");
     response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
     response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
   } else {
     // For e2b/vercel deployments, use restricted CORS policies
     const ALLOWED_ORIGINS = [
       "https://lenormand.dk",
       "https://www.lenormand.dk",
       "https://lenormand-intelligence.vercel.app",
     ];
     const origin = request.headers.get('origin');
     if (origin && ALLOWED_ORIGINS.includes(origin)) {
       response.headers.set("Access-Control-Allow-Origin", origin);
     }
     response.headers.set("Access-Control-Allow-Methods", "GET, POST");
     response.headers.set("Access-Control-Allow-Headers", "Content-Type");
   }
  
  // Remove server signature for security
  response.headers.delete("server");

  return response;
}

export const config = {
  matcher: ["/:path*"],
};
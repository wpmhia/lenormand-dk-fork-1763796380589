import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Minimal middleware - optimized for Vercel free plan
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip all processing for static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".js") ||
    pathname.endsWith(".woff2")
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  // Essential security headers only (minimal overhead)
  response.headers.set("X-Content-Type-Options", "nosniff");
  // X-Frame-Options removed to allow E2B iframe embedding
  response.headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' https://images.unsplash.com https://storage.ko-fi.com data:; font-src 'self'; connect-src 'self' https://api.deepseek.com; frame-src 'self' https://e2b.dev https://*.e2b.dev; base-uri 'self'; form-action 'self';");

  // Add caching for static pages (not API routes)
  if (!pathname.startsWith("/api/")) {
    // Aggressive caching for static pages - reduces compute
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=7200, stale-while-revalidate=86400"
    );
  }

  // Remove incorrect Accept-Encoding header setting - it's a request header, not response
  // (Server cannot dictate client encoding preferences)

  return response;
}

export const config = {
  matcher: ["/api/:path*", "/read/:path*", "/cards/:path*", "/learn/:path*"],
};

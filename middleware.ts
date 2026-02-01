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
  response.headers.set("X-Frame-Options", "DENY");

  // Add caching for static pages (not API routes)
  if (!pathname.startsWith("/api/")) {
    // Aggressive caching for static pages - reduces compute
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=7200, stale-while-revalidate=86400"
    );
  }

  // Compression hint for API routes
  if (pathname.startsWith("/api/")) {
    response.headers.set("Accept-Encoding", "gzip, deflate, br");
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*", "/read/:path*", "/cards/:path*", "/learn/:path*"],
};

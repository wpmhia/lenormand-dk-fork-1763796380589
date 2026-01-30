import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Minimal middleware - speed is everything
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

  // Minimal security headers only
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Add caching for static pages (not API routes)
  if (!pathname.startsWith("/api/")) {
    // Cache static pages for 1 hour, stale-while-revalidate for 24 hours
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400"
    );
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*", "/read/:path*", "/cards/:path*", "/learn/:path*"],
};

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

  return response;
}

export const config = {
  matcher: ["/api/:path*", "/read/:path*"],
};

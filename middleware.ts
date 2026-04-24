import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const response = NextResponse.next();

  // Basic security headers
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Minimal CSP - allow images from all sources for card displays
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cloud.umami.is; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.mistral.ai https://api.umami.is https://api-gateway.umami.dev; frame-ancestors 'self';"
  );

  // Add caching for static pages (not API routes)
  if (!pathname.startsWith("/api/")) {
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=7200, stale-while-revalidate=86400"
    );
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico).*))"],
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const response = NextResponse.next();

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

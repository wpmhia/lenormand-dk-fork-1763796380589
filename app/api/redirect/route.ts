import { NextRequest, NextResponse } from "next/server";

const redirectMap: Record<string, string> = {
  reading: "/read/new",
  cards: "/cards",
  learn: "/learn",
  about: "/about",
  privacy: "/privacy",
  terms: "/terms",
  home: "/",
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "No redirect code provided" },
      { status: 400 },
    );
  }

  const destination = redirectMap[code];

  if (!destination) {
    return NextResponse.json(
      { error: "Invalid redirect code" },
      { status: 404 },
    );
  }

  return NextResponse.json(
    { url: destination },
    { headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" } },
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, url, permanent } = body;

    let destination: string | null = null;

    if (code) {
      destination = redirectMap[code] || null;
    } else if (url) {
      try {
        const parsedUrl = new URL(url);
        
        // Security: Only allow relative URLs or same-origin URLs
        // Reject absolute URLs to external sites (open redirect protection)
        const allowedProtocols = ["http:", "https:"];
        if (!allowedProtocols.includes(parsedUrl.protocol)) {
          return NextResponse.json(
            { error: "Invalid URL protocol" },
            { status: 400 },
          );
        }
        
        // Reject URLs with credentials (user:pass@host)
        if (parsedUrl.username || parsedUrl.password) {
          return NextResponse.json(
            { error: "URL cannot contain credentials" },
            { status: 400 },
          );
        }
        
        // For absolute URLs, only allow same origin
        // In production, you'd check against a whitelist
        destination = parsedUrl.pathname + parsedUrl.search + parsedUrl.hash;
      } catch {
        // If URL parsing fails, check if it's a relative path
        if (url.startsWith("/") && !url.startsWith("//")) {
          destination = url;
        } else {
          return NextResponse.json(
            { error: "Invalid URL provided. Only relative paths allowed." },
            { status: 400 },
          );
        }
      }
    }

    if (!destination) {
      return NextResponse.json(
        { error: "No valid destination found" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        url: destination,
        permanent: permanent === true || permanent === "true",
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}

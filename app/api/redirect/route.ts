import { NextRequest, NextResponse } from "next/server";

const redirectMap: Record<string, string> = {
  "reading": "/read/new",
  "cards": "/cards",
  "learn": "/learn",
  "about": "/about",
  "privacy": "/privacy",
  "terms": "/terms",
  "home": "/",
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "No redirect code provided" },
      { status: 400 }
    );
  }

  const destination = redirectMap[code];

  if (!destination) {
    return NextResponse.json(
      { error: "Invalid redirect code" },
      { status: 404 }
    );
  }

  return NextResponse.json(
    { url: destination },
    { headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" } }
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
        destination = new URL(url).toString();
      } catch {
        return NextResponse.json(
          { error: "Invalid URL provided" },
          { status: 400 }
        );
      }
    }

    if (!destination) {
      return NextResponse.json(
        { error: "No valid destination found" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        url: destination,
        permanent: permanent === true || permanent === "true",
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

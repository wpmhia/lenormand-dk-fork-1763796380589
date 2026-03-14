export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { memberships } from "@/lib/schema";
import { corsHeaders } from "@/lib/cors";

const VIP_CODE = "LenormandVIP";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return new Response(
        JSON.stringify({ error: "Sign in to redeem a code" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const body = await request.json();
    const { code } = body;

    if (!code || code.trim() !== VIP_CODE) {
      return new Response(
        JSON.stringify({ error: "Invalid code. Please check and try again." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const now = new Date();
    // VIP code gives unlimited access without expiry (or very far expiry)
    const farFuture = new Date();
    farFuture.setFullYear(farFuture.getFullYear() + 100);

    await db
      .insert(memberships)
      .values({
        userId: session.user.id,
        tier: "unlimited",
        status: "active",
        startedAt: now,
        expiresAt: farFuture,
      })
      .onConflictDoUpdate({
        target: memberships.userId,
        set: {
          tier: "unlimited",
          status: "active",
          expiresAt: farFuture,
          updatedAt: now,
        },
      });

    return new Response(
      JSON.stringify({ success: true, message: "VIP access activated!" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("VIP redeem error:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
}

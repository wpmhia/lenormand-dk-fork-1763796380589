export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { memberships, readingUsage } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { corsHeaders } from "@/lib/cors";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return new Response(
        JSON.stringify({ isMember: false, tier: "free", remaining: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userId = session.user.id;
    const today = new Date().toISOString().split("T")[0];

    // Get membership status
    const membershipRecord = await db
      .select()
      .from(memberships)
      .where(eq(memberships.userId, userId))
      .limit(1);

    const membership = membershipRecord[0];
    const now = new Date();
    
    // Check if membership is expired
    let isMember = false;
    let tier: "free" | "unlimited" = "free";
    let expiresAt: Date | null = null;
    
    if (membership && membership.tier === "unlimited" && membership.status === "active") {
      if (membership.expiresAt && new Date(membership.expiresAt) > now) {
        isMember = true;
        tier = "unlimited";
        expiresAt = membership.expiresAt;
      } else if (!membership.expiresAt) {
        // Legacy VIP or no expiry set
        isMember = true;
        tier = "unlimited";
      }
    }

    // Get today's usage for free users
    let usage = { count: 0 };
    if (!isMember) {
      const usageRecord = await db
        .select()
        .from(readingUsage)
        .where(and(eq(readingUsage.userId, userId), eq(readingUsage.date, today)))
        .limit(1);
      
      if (usageRecord.length > 0) {
        usage = usageRecord[0];
      }
    }

    const remaining = isMember ? Infinity : Math.max(0, 1 - usage.count);

    return new Response(
      JSON.stringify({
        isMember,
        tier,
        remaining,
        expiresAt: expiresAt?.toISOString() ?? null,
        usage: isMember ? null : usage,
      }),
      { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Status API error:", error);
    return new Response(
      JSON.stringify({ isMember: false, tier: "free", remaining: 0 }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
}

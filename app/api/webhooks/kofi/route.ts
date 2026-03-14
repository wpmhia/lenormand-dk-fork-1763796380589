export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { memberships } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { user } from "@/lib/auth-schema";

const KOFI_VERIFICATION_TOKEN = process.env.KOFI_VERIFICATION_TOKEN;

interface KoFiWebhookData {
  verification_token: string;
  message_id: string;
  timestamp: string;
  type: string;
  is_public: boolean;
  from_name: string;
  message: string | null;
  amount: string;
  url: string;
  email: string;
  currency: string;
  is_subscription_payment: boolean;
  is_first_subscription_payment: boolean;
  kofi_transaction_id: string;
  shop_items: null | any[];
  tier_name: string | null;
}

export async function POST(request: NextRequest) {
  try {
    // Parse form-urlencoded data
    const formData = await request.formData();
    const dataString = formData.get("data") as string;
    
    if (!dataString) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    const data: KoFiWebhookData = JSON.parse(dataString);

    // Verify token
    if (data.verification_token !== KOFI_VERIFICATION_TOKEN) {
      return NextResponse.json({ error: "Invalid verification token" }, { status: 401 });
    }

    // Only process subscription payments
    if (!data.is_subscription_payment) {
      return NextResponse.json({ success: true, message: "Not a subscription payment" });
    }

    // Only process "Unlimited AI Interpretations" tier
    if (data.tier_name !== "Unlimited AI Interpretations") {
      return NextResponse.json({ success: true, message: "Not the correct tier" });
    }

    // Find user by email
    const userRecord = await db
      .select()
      .from(user)
      .where(eq(user.email, data.email))
      .limit(1);

    if (userRecord.length === 0) {
      console.error(`Ko-Fi webhook: No user found with email ${data.email}`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = userRecord[0].id;
    const now = new Date();
    
    // Check if user already has a membership
    const existingMembership = await db
      .select()
      .from(memberships)
      .where(eq(memberships.userId, userId))
      .limit(1);

    if (existingMembership.length > 0) {
      // Extend membership by 1 month from current expiry or now
      const currentExpiresAt = existingMembership[0].expiresAt;
      const baseDate = currentExpiresAt && new Date(currentExpiresAt) > now 
        ? new Date(currentExpiresAt) 
        : now;
      
      const newExpiresAt = new Date(baseDate);
      newExpiresAt.setMonth(newExpiresAt.getMonth() + 1);

      await db
        .update(memberships)
        .set({
          tier: "unlimited",
          status: "active",
          expiresAt: newExpiresAt,
          koFiTransactionId: data.kofi_transaction_id,
          koFiEmail: data.email,
          updatedAt: now,
        })
        .where(eq(memberships.userId, userId));
    } else {
      // Create new membership
      const expiresAt = new Date(now);
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      await db.insert(memberships).values({
        userId,
        tier: "unlimited",
        status: "active",
        startedAt: now,
        expiresAt,
        koFiTransactionId: data.kofi_transaction_id,
        koFiEmail: data.email,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ko-Fi webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

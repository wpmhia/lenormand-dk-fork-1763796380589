import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userSupporter } from "@/lib/schema";
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

    await db
      .insert(userSupporter)
      .values({ userId: session.user.id })
      .onConflictDoNothing();

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

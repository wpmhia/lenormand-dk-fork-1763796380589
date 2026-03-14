import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userSupporter } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { corsHeaders } from "@/lib/cors";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return new Response(
        JSON.stringify({ isVip: false }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const record = await db
      .select()
      .from(userSupporter)
      .where(eq(userSupporter.userId, session.user.id))
      .limit(1);

    return new Response(
      JSON.stringify({ isVip: record.length > 0 }),
      { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...corsHeaders } }
    );
  } catch {
    return new Response(
      JSON.stringify({ isVip: false }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
}

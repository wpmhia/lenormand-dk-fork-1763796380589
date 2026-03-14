import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "@/lib/auth-schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      const { sendPasswordResetEmail } = await import("@/lib/email-helpers");
      await sendPasswordResetEmail(user.email, user.name, url);
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  trustedOrigins: [
    "https://lenormand.dk",
    "http://localhost:3000",
    "http://localhost:4000",
    "*.e2b.app",
  ],
  ...(process.env.NODE_ENV !== "production" && {
    advanced: {
      cookies: {
        session_token: {
          attributes: {
            sameSite: "none" as const,
            secure: true,
          },
        },
      },
    },
  }),
});

export type Session = typeof auth.$Infer.Session;

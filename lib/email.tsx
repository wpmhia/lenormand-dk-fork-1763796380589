import { Resend } from "resend";
import { EmailTemplate } from "@daveyplate/better-auth-ui/server";
import * as React from "react";

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.EMAIL_FROM ?? "onboarding@resend.dev";

export async function sendEmail({
  to,
  subject,
  heading,
  action,
  content,
  url,
}: {
  to: string;
  subject: string;
  heading: string;
  action: string;
  content: React.ReactNode;
  url: string;
}) {
  await resend.emails.send({
    from: fromEmail,
    to,
    subject,
    react: EmailTemplate({
      heading,
      action,
      content,
      siteName: process.env.NEXT_PUBLIC_SITE_NAME,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
      url,
    }) as React.ReactElement,
  });
}

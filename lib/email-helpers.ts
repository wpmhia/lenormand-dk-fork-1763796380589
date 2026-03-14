import { sendEmail } from "@/lib/email";

export async function sendPasswordResetEmail(email: string, name: string | null | undefined, url: string) {
  const { createElement } = await import("react");
  const displayName = name || email.split("@")[0];
  
  await sendEmail({
    to: email,
    subject: "Reset your password - Lenormand Intelligence",
    heading: "Reset Password",
    action: "Reset Password",
    content: createElement("span", null,
      `Hello ${displayName}, click the button below to reset your password. This link expires shortly.`
    ),
    url,
  });
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lenormand Readings | AI-Powered Card Reading & Interpretation",
  description:
    "Get personalized Lenormand card readings powered by AI. Draw cards, interpret their meanings, and receive guidance based on the 36-card deck. Free online readings.",
  openGraph: {
    title: "Lenormand Readings | AI-Powered Guidance",
    description:
      "Get personalized AI-powered Lenormand readings with professional interpretations.",
    type: "website",
    url: "https://lenormand.dk/read",
  },
};

export default function ReadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

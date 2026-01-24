import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Reading | AI Lenormand Card Reading & Interpretation",
  description:
    "Create a new Lenormand reading. Choose a spread, draw cards, and receive AI-powered interpretations of your reading. Free personalized guidance.",
  openGraph: {
    title: "New Lenormand Reading",
    description:
      "Draw Lenormand cards and receive AI-powered interpretation and guidance.",
    type: "website",
    url: "https://lenormand.dk/read/new",
  },
};

export default function NewReadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

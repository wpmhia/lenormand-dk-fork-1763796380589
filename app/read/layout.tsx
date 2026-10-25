import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lenormand Readings | Bring Your Reading to Your AI Assistant",
  description:
    "Draw traditional Lenormand cards, copy the complete reading prompt, and interpret it with ChatGPT, Claude, Gemini, or any AI assistant. Or get an interpretation directly on the site.",
  openGraph: {
    title: "Lenormand Readings | Your Cards. Your AI.",
    description:
      "We provide the cards and the Lenormand method. Your AI assistant brings the interpretation of your story.",
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

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Lenormand Reading | Your Cards. Your AI.",
  description:
    "Ask your question, draw your Lenormand cards, and copy the complete reading prompt into your favorite AI assistant. Free, no account required.",
  openGraph: {
    title: "New Lenormand Reading",
    description:
      "Draw traditional Lenormand cards and take the complete reading prompt to your own AI assistant.",
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

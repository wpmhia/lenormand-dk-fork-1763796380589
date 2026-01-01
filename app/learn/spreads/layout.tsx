import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Spreads & Techniques | Lenormand Learning Course",
  description:
    "Discover powerful Lenormand spreads and advanced reading techniques. Learn 3-card, cross spread, and Grand Tableau methods.",
  keywords: [
    "Lenormand spreads",
    "card spreads",
    "reading techniques",
    "Grand Tableau",
    "cross spread",
    "Lenormand layouts",
  ],
  openGraph: {
    title: "Spreads & Techniques | Learning Module",
    description:
      "Master powerful Lenormand spreads and advanced reading techniques to deepen your practice.",
  },
};

export default function SpreadsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

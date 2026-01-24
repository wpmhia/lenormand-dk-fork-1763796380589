import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "History & Origins of Lenormand | Free Divination Course",
  description:
    "Explore the fascinating history of Lenormand from 18th century France to modern day. Learn about Marie-Anne Lenormand and the evolution of the 36-card deck.",
  keywords: [
    "Lenormand history",
    "Marie-Anne Lenormand",
    "Lenormand origins",
    "history of divination",
    "Lenormand deck evolution",
  ],
  openGraph: {
    title: "History & Origins of Lenormand | Learning Module",
    description:
      "Discover the rich history of Lenormand divination and Marie-Anne Lenormand's legacy.",
    type: "website",
    url: "https://lenormand.dk/learn/history",
  },
};

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

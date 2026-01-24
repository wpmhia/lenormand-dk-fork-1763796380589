import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Read Lenormand | Reading Basics Course Module",
  description:
    "Master the fundamentals of reading Lenormand cards as meaningful sentences. Learn card positioning, combinations, and the core reading methodology.",
  keywords: [
    "how to read Lenormand",
    "Lenormand reading techniques",
    "card combinations",
    "Lenormand sentence method",
    "card positioning",
  ],
  openGraph: {
    title: "How to Read Lenormand | Learning Module",
    description:
      "Learn the fundamentals of Lenormand reading with our comprehensive guide to card combinations and interpretations.",
    type: "website",
    url: "https://lenormand.dk/learn/reading-basics",
  },
};

export default function ReadingBasicsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

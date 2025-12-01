import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Marie-Anne's System | Lenormand Expert Method",
  description: "Learn Marie-Anne Lenormand's specialized reading system. Explore the legendary reader's interpretation methods and traditional salon techniques.",
  keywords: [
    "Marie-Anne Lenormand system",
    'Lenormand method',
    'historical reading method',
    'salon readings',
    'traditional interpretation',
  ],
  openGraph: {
    title: "Marie-Anne's System | Learning Module",
    description: "Explore the specialized reading system attributed to the legendary Marie-Anne Lenormand.",
  },
};

export default function MarieAnnesSystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

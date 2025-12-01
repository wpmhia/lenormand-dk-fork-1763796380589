import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Advanced Lenormand Concepts | Expert Course Module',
  description: 'Explore advanced Lenormand concepts including time associations, playing card meanings, and cultural interpretations. Take your practice to the next level.',
  keywords: [
    'advanced Lenormand',
    'time associations',
    'playing cards Lenormand',
    'Lenormand interpretations',
    'professional reading',
  ],
  openGraph: {
    title: 'Advanced Concepts | Learning Module',
    description: 'Master advanced Lenormand concepts and professional reading techniques.',
  },
};

export default function AdvancedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

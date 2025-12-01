import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Introduction to Lenormand | Free Divination Course',
  description: 'Start your Lenormand journey. Learn what Lenormand is, discover its history, and understand why it\'s the most direct form of divination.',
  keywords: [
    'introduction to Lenormand',
    'what is Lenormand',
    'Lenormand for beginners',
    'learn Lenormand basics',
  ],
  openGraph: {
    title: 'Introduction to Lenormand | Learn Divination',
    description: 'Discover what makes Lenormand unique. Learn the basics of this 36-card divination system.',
  },
};

export default function IntroductionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

import type { Metadata } from 'next';
import Script from 'next/script';
import { LearningFAQSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
  title: 'Learn Lenormand | Free Online Divination Course & Card Meanings',
  description: 'Master Lenormand divination with our free comprehensive course. Learn card meanings, reading techniques, spreads, and advanced methods. From beginner to expert level.',
  keywords: [
    'learn Lenormand',
    'Lenormand course',
    'Lenormand card meanings',
    'how to read Lenormand',
    'Lenormand reading techniques',
    'Lenormand spreads',
    'divination learning',
    'fortune telling course',
    'cartomancy guide',
    'Lenormand history',
  ],
  openGraph: {
    title: 'Learn Lenormand | Free Online Divination Course',
    description: 'Master Lenormand divination from beginner to advanced. Learn 36-card deck meanings, reading methods, and professional techniques.',
    type: 'website',
    url: 'https://lenormand-intelligence.com/learn',
    siteName: 'Lenormand Intelligence',
    images: [
      {
        url: 'https://lenormand-intelligence.com/favicon-512.png',
        width: 512,
        height: 512,
        alt: 'Lenormand Intelligence Learning Course',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Learn Lenormand | Free Online Course',
    description: 'Comprehensive Lenormand learning from basics to advanced techniques. Free course with card meanings and reading guides.',
  },
};

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const learningSchema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: 'Lenormand Divination Mastery',
    description: 'Comprehensive course teaching Lenormand card divination from beginner to advanced levels',
    url: 'https://lenormand-intelligence.com/learn',
    creator: {
      '@type': 'Organization',
      name: 'Lenormand Intelligence',
      url: 'https://lenormand-intelligence.com',
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseName: 'Lenormand Divination Mastery',
      description: 'Free online course covering all aspects of Lenormand reading',
      isAccessibleForFree: true,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '487',
    },
  };

  return (
    <>
      <Script
        id="learning-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(learningSchema) }}
        strategy="afterInteractive"
      />
      <LearningFAQSchema />
      {children}
    </>
  );
}

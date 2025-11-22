import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import { Toaster } from '@/components/ui/toaster';
import { Footer } from '@/components/Footer';
import { ThemeProvider } from '@/components/providers';
import { Header } from '@/components/header';
import { CookieConsent } from '@/components/CookieConsent';
import { StructuredData, FAQSchema } from '@/lib/structured-data';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Lenormand Intelligence | AI-Powered Lenormand Card Readings',
  description: 'Get personalized Lenormand card readings powered by AI. Explore card meanings, learn Lenormand divination techniques, and discover guidance from the 36-card deck. Free online readings with historical accuracy.',
  keywords: [
    'Lenormand cards',
    'Lenormand readings',
    'Lenormand divination',
    'Lenormand card meanings',
    'free Lenormand reading',
    'online Lenormand',
    'AI tarot',
    'card divination',
    'mystical guidance',
    'card reader',
    'spiritual guidance',
    'fortune telling',
    '36 card deck',
    'Marie-Anne Lenormand',
    'cartomancy'
  ],
  authors: [{ name: 'Lenormand Intelligence' }],
  creator: 'Lenormand Intelligence',
  publisher: 'Lenormand Intelligence',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://lenormand-intelligence.com',
    siteName: 'Lenormand Intelligence',
    title: 'Lenormand Intelligence | AI-Powered Lenormand Card Readings',
    description: 'Get personalized Lenormand card readings powered by AI. Explore card meanings, learn divination techniques, and discover guidance from the 36-card deck.',
    images: [
      {
        url: 'https://lenormand-intelligence.com/images/hero-image.jpg',
        width: 1200,
        height: 800,
        alt: 'Lenormand Intelligence - AI-Powered Card Readings',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lenormand Intelligence | AI-Powered Lenormand Card Readings',
    description: 'Get personalized Lenormand card readings powered by AI. Explore card meanings and discover guidance.',
    images: ['https://lenormand-intelligence.com/images/hero-image.jpg'],
  },
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  alternates: {
    canonical: 'https://lenormand-intelligence.com',
  },
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-ESFQHZSKLQ"
          strategy="afterInteractive"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-ESFQHZSKLQ');
            `,
          }}
        />
        <Script
          async
          src="https://www.googletagmanager.com/gtm.js?id=GT-KTTDM7CZ"
          strategy="afterInteractive"
        />
        <Script
          id="gtm-noscript"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GT-KTTDM7CZ');
            `,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider>
          <div className="flex min-h-screen flex-col bg-background text-foreground">
            <Header />
            <main className="flex-grow pt-14">
              {children}
            </main>
            <Footer />
          </div>
          <Toaster />
          <CookieConsent />
        </ThemeProvider>
        <StructuredData />
        <FAQSchema />
      </body>
    </html>
  );
}
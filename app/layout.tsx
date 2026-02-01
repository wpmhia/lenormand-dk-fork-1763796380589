import "./globals.css";
import type { Metadata } from "next";
import { Inter, Crimson_Pro } from "next/font/google";
import Script from "next/script";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/header";
import { CookieConsent } from "@/components/CookieConsent";
import { createSafeJsonLd } from "@/lib/sanitize";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ["system-ui", "arial"],
});

const crimsonPro = Crimson_Pro({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ["serif"],
  weight: ["700"],
});

export const metadata: Metadata = {
  title: "Lenormand Intelligence | Clear Answers from the Sentence Oracle",
  description:
    "Get clear, practical answers from Lenormand cards. Not symbolism - sentences. Free 1-3 card readings. Support on Ko-Fi for 9-card & Grand Tableau.",
  keywords: [
    "Lenormand cards",
    "Lenormand readings",
    "Lenormand sentence reading",
    "practical Lenormand",
    "Lenormand 3 card spread",
    "Lenormand 9 card spread",
    "Lenormand Grand Tableau",
    "online Lenormand",
    "lenormand vs tarot",
    "card divination",
    "36 card deck",
    "Marie-Anne Lenormand",
    "cartomancy",
    "clear card answers",
  ],
  authors: [{ name: "Lenormand Intelligence" }],
  creator: "Lenormand Intelligence",
  publisher: "Lenormand Intelligence",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://lenormand.dk",
    siteName: "Lenormand Intelligence",
    title: "Lenormand Intelligence | Clear Answers from the Sentence Oracle",
    description:
      "Get clear, practical answers from Lenormand cards. Free 1-3 card readings. Support on Ko-Fi for 9-card & Grand Tableau.",
    images: [
      {
        url: "https://lenormand.dk/favicon-512.png",
        width: 512,
        height: 512,
        alt: "Lenormand Intelligence - Clear Lenormand Card Readings",
        type: "image/png",
      },
      {
        url: "https://lenormand.dk/images/hero-image.jpg",
        width: 1200,
        height: 800,
        alt: "Lenormand Intelligence - Clear Lenormand Card Readings",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lenormand Intelligence | Clear Answers from the Sentence Oracle",
    description:
      "Get clear, practical answers from Lenormand cards. Free 1-3 card readings. Support on Ko-Fi for 9-card & Grand Tableau.",
    images: ["https://lenormand.dk/favicon-512.png"],
    creator: "@LenormandAI",
  },
  icons: {
    icon: [
      { rel: "icon", url: "/favicon.ico" },
      {
        rel: "icon",
        url: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        rel: "icon",
        url: "/favicon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        rel: "icon",
        url: "/favicon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: "/favicon-192.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "https://lenormand.dk",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Lenormand Intelligence",
  description:
    "AI-powered Lenormand card readings and divination guidance platform",
  url: "https://lenormand.dk",
  applicationCategory: "Lifestyle",
  isAccessibleForFree: false,
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Lenormand?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Lenormand is a 36-card cartomancy system named after Marie-Anne Lenormand. It uses everyday symbolism read in combinations to tell stories.",
      },
    },
    {
      "@type": "Question",
      name: "How many cards are in a Lenormand deck?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A traditional Lenormand deck has exactly 36 cards, from the Rider (card 1) to the Key (card 36).",
      },
    },
    {
      "@type": "Question",
      name: "How do Lenormand cards differ from tarot?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Lenormand uses 36 concrete cards read as sentences for direct guidance, while Tarot uses 78 archetypal cards for psychological insight.",
      },
    },
  ],
};

// Sanitize GA ID to prevent XSS via environment variable injection
function sanitizeGaId(id: string | undefined): string {
  if (!id) return "G-XXXXXXXXXX";
  // Only allow alphanumeric, hyphens, and underscores (valid GA ID characters)
  const sanitized = id.replace(/[^a-zA-Z0-9_-]/g, "");
  // GA IDs typically start with G- and are 10+ chars
  if (!sanitized.startsWith("G-") || sanitized.length < 5) {
    return "G-XXXXXXXXXX";
  }
  return sanitized;
}

const GA_MEASUREMENT_ID = sanitizeGaId(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://cdn.buymeacoffee.com" />
        <Script
          id="google-analytics"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
        <Script
          id="schema-org"
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: createSafeJsonLd(structuredData) }}
        />
        <Script
          id="faq-schema"
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: createSafeJsonLd(faqSchema) }}
        />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="lazyOnload"
        />
      </head>
      <body
        className={`${inter.className} antialiased`}
        suppressHydrationWarning
      >
        <TooltipProvider>
          <div
            className="flex min-h-screen flex-col bg-background text-foreground"
            suppressHydrationWarning
          >
            <Header />
            <main className="flex-grow pt-14">{children}</main>
            <Footer />
          </div>
          <Toaster />
          <CookieConsent />
        </TooltipProvider>
      </body>
    </html>
  );
}

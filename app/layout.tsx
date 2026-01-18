import "./globals.css";
import type { Metadata } from "next";
import { Inter, Crimson_Pro } from "next/font/google";
import Script from "next/script";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/components/providers";
import { Header } from "@/components/header";
import { CookieConsent } from "@/components/CookieConsent";
import {
  StructuredData,
  FAQSchema,
  HowToSchema,
  LearningCourseSchema,
} from "@/lib/structured-data";

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
  title: "Lenormand Intelligence | AI-Powered Lenormand Card Readings",
  description:
    "Get personalized Lenormand card readings powered by AI. Explore card meanings, learn Lenormand divination techniques, and discover guidance from the 36-card deck. Free online readings with historical accuracy.",
  keywords: [
    "Lenormand cards",
    "Lenormand readings",
    "Lenormand divination",
    "Lenormand card meanings",
    "free Lenormand reading",
    "online Lenormand",
    "AI tarot",
    "card divination",
    "mystical guidance",
    "card reader",
    "spiritual guidance",
    "fortune telling",
    "36 card deck",
    "Marie-Anne Lenormand",
    "cartomancy",
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
    title: "Lenormand Intelligence | AI-Powered Lenormand Card Readings",
    description:
      "Get personalized Lenormand card readings powered by AI. Explore card meanings, learn divination techniques, and discover guidance from the 36-card deck.",
    images: [
      {
        url: "https://lenormand.dk/favicon-512.png",
        width: 512,
        height: 512,
        alt: "Lenormand Intelligence - AI-Powered Card Readings",
        type: "image/png",
      },
      {
        url: "https://lenormand.dk/images/hero-image.jpg",
        width: 1200,
        height: 800,
        alt: "Lenormand Intelligence - AI-Powered Card Readings",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lenormand Intelligence | AI-Powered Lenormand Card Readings",
    description:
      "Get personalized Lenormand card readings powered by AI. Explore card meanings and discover guidance.",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://storage.ko-fi.com" />
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-WDLWCCJCY8"
          strategy="lazyOnload"
        />
        <Script
          id="google-analytics"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
               window.dataLayer = window.dataLayer || [];
               function gtag(){dataLayer.push(arguments);}
               gtag('js', new Date());
               gtag('config', 'G-WDLWCCJCY8');
              `,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <TooltipProvider>
          <ThemeProvider>
            <div className="flex min-h-screen flex-col bg-background text-foreground">
              <Header />
              <main className="flex-grow pt-14">{children}</main>
              <Footer />
            </div>
            <Toaster />
            <CookieConsent />
          </ThemeProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}

import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { Footer } from '@/components/Footer';
import { ThemeProvider } from '@/components/providers';
import { Header } from '@/components/header';
import { CookieConsent } from '@/components/CookieConsent';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Lenormand Intelligence',
  description: 'Discover guidance and insight through mystical Lenormand cards. Create personalized readings, explore card meanings, and unlock wisdom of the 36-card deck.',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
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

      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <ThemeProvider>
          <div className="bg-background text-foreground flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow pt-14">
              {children}
            </main>
            <Footer />
          </div>
           <Toaster />
           <CookieConsent />
         </ThemeProvider>
       </body>
    </html>
  );
}
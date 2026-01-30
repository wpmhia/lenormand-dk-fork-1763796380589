"use client";

import Link from "next/link";
import { Heart } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const resetCookieConsent = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("lenormand-cookie-consent");
      localStorage.removeItem("lenormand-cookie-preferences");
      window.location.reload();
    }
  };

  return (
    <footer className="border-t border-border bg-background/50" suppressHydrationWarning>
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-4 gap-4 md:grid-cols-4 md:gap-8">
          <div className="col-span-1">
            <Link href="/" className="block">
              <h3 className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-lg font-bold text-transparent">
                Lenormand
              </h3>
            </Link>
            <p className="mt-1 text-[10px] text-muted-foreground">
              AI-Enhanced Divination
            </p>
          </div>

          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Explore
            </h4>
            <ul className="space-y-1 text-xs">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/read/new" className="text-muted-foreground hover:text-primary transition-colors">
                  Reading
                </Link>
              </li>
              <li>
                <Link href="/cards" className="text-muted-foreground hover:text-primary transition-colors">
                  Cards
                </Link>
              </li>
              <li>
                <Link href="/learn" className="text-muted-foreground hover:text-primary transition-colors">
                  Learn
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Links
            </h4>
            <ul className="space-y-1 text-xs">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms
                </Link>
              </li>
                <li>
                  <button onClick={resetCookieConsent} className="text-muted-foreground hover:text-primary transition-colors">
                    Cookies
                  </button>
                </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Support
            </h4>
            <ul className="space-y-1 text-xs">
              <li>
                <a
                  href="https://ko-fi.com/Y8Y81NVDEK"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Heart className="h-3 w-3" />
                  Ko-fi
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-2 text-[10px] text-muted-foreground">
          <span>© {currentYear} Lenormand Intelligence</span>
          <span className="flex items-center gap-1">
            Made with
            <Heart className="h-2.5 w-2.5 text-primary/60" />
            in Denmark
          </span>
        </div>
      </div>
    </footer>
  );
}
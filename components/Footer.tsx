import Link from "next/link";
import { Heart, Mail, Sparkles } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-gradient-to-b from-background to-background/80">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="mb-8 grid gap-8 md:grid-cols-12">
          {/* Brand Section */}
          <div className="md:col-span-3">
            <Link href="/" className="mb-4 inline-block">
              <h3 className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-lg font-bold text-transparent">
                Lenormand
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                AI-Enhanced Divination
              </p>
            </Link>
            <p className="max-w-xs text-xs leading-relaxed text-muted-foreground/70">
              Explore timeless card wisdom combined with modern AI insights for
              meaningful readings.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-3">
            <h4 className="mb-3 text-sm font-semibold text-foreground/80">
              Explore
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/read/new"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  New Reading
                </Link>
              </li>
              <li>
                <Link
                  href="/cards"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  Card Guide
                </Link>
              </li>
              <li>
                <Link
                  href="/learn"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  Learn
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="md:col-span-3">
            <h4 className="mb-3 text-sm font-semibold text-foreground/80">
              Resources
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/learn/spreads"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  Spreads
                </Link>
              </li>
              <li>
                <Link
                  href="/learn/history"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  History
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  About
                </Link>
              </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => {
                      localStorage.removeItem("lenormand-cookie-consent");
                      localStorage.removeItem("lenormand-cookie-preferences");
                      window.location.reload();
                    }}
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    Cookie Preferences
                  </button>
                </li>
            </ul>
          </div>

          {/* Support */}
          <div className="md:col-span-3">
            <h4 className="mb-3 text-sm font-semibold text-foreground/80">
              Support
            </h4>
            <p className="mb-3 text-xs text-muted-foreground/70">
              Enjoying Lenormand Intelligence?
            </p>
            <a
              href="https://ko-fi.com/Y8Y81NVDEK"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-medium text-primary transition-colors hover:text-primary/80"
            >
              <Heart className="h-3.5 w-3.5" />
              Support Us
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="mb-6 h-px bg-gradient-to-r from-border via-border/50 to-border" />

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 text-xs text-muted-foreground/60 md:flex-row">
          <div className="text-center md:text-left">
            <p>
              © {currentYear} Lenormand Intelligence. Entertainment & spiritual
              guidance.
            </p>
          </div>
          <div className="flex items-center gap-1">
            <span>Made with</span>
            <Heart className="h-3 w-3 text-primary/60" aria-hidden="true" />
            <span>in Denmark</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

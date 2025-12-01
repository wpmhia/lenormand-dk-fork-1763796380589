import Link from 'next/link'
import { Heart, Mail, Sparkles } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-gradient-to-b from-background to-background/80">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid gap-8 md:grid-cols-12 mb-8">
          {/* Brand Section */}
          <div className="md:col-span-3">
            <Link href="/" className="inline-block mb-4">
              <h3 className="text-lg font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Lenormand
              </h3>
              <p className="text-xs text-muted-foreground mt-1">AI-Enhanced Divination</p>
            </Link>
            <p className="text-xs text-muted-foreground/70 leading-relaxed max-w-xs">
              Explore timeless card wisdom combined with modern AI insights for meaningful readings.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-3">
            <h4 className="text-sm font-semibold text-foreground/80 mb-3">Explore</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/read/new" className="text-muted-foreground hover:text-primary transition-colors">
                  New Reading
                </Link>
              </li>
              <li>
                <Link href="/cards" className="text-muted-foreground hover:text-primary transition-colors">
                  Card Guide
                </Link>
              </li>
              <li>
                <Link href="/learn" className="text-muted-foreground hover:text-primary transition-colors">
                  Learn
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="md:col-span-3">
            <h4 className="text-sm font-semibold text-foreground/80 mb-3">Resources</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/learn/spreads" className="text-muted-foreground hover:text-primary transition-colors">
                  Spreads
                </Link>
              </li>
              <li>
                <Link href="/learn/history" className="text-muted-foreground hover:text-primary transition-colors">
                  History
                </Link>
              </li>
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
            </ul>
          </div>

          {/* Support */}
          <div className="md:col-span-3">
            <h4 className="text-sm font-semibold text-foreground/80 mb-3">Support</h4>
            <p className="text-xs text-muted-foreground/70 mb-3">
              Enjoying Lenormand Intelligence?
            </p>
            <a 
              href='https://ko-fi.com/Y8Y81NVDEK' 
              target='_blank' 
              rel='noopener noreferrer' 
              className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <Heart className="h-3.5 w-3.5" />
              Support Us
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-border via-border/50 to-border mb-6" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground/60">
          <div className="text-center md:text-left">
            <p>© {currentYear} Lenormand Intelligence. Entertainment & spiritual guidance.</p>
          </div>
          <div className="flex items-center gap-1">
            <span>Made with</span>
            <Heart className="h-3 w-3 text-primary/60" aria-hidden="true" />
            <span>in Denmark</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

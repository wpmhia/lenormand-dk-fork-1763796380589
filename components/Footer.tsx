import Link from 'next/link'
import { Heart, Shield, Eye } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border/50 bg-background/50">
      <div className="container mx-auto px-4 py-8">
        {/* Compact Footer Grid */}
        <div className="mb-6 grid gap-6 sm:grid-cols-4 text-sm text-muted-foreground">
          {/* About */}
          <div className="space-y-2">
            <h4 className="text-base font-medium text-foreground/60">About</h4>
            <p className="text-xs leading-relaxed text-muted-foreground/80">
              Explore the wisdom of Lenormand cards with AI-enhanced interpretations. Discover timeless divination traditions combined with modern technology.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h4 className="text-base font-medium text-foreground/60">Navigate</h4>
            <nav className="space-y-1" aria-label="Quick navigation">
              <Link href="/read/new" className="block text-xs text-muted-foreground transition-colors hover:text-foreground/80">
                New Reading
              </Link>
              <Link href="/cards" className="block text-xs text-muted-foreground transition-colors hover:text-foreground/80">
                Explore Cards
              </Link>
              <Link href="/learn/reading-basics" className="block text-xs text-muted-foreground transition-colors hover:text-foreground/80">
                Learn
              </Link>
            </nav>
          </div>

          {/* Resources */}
          <div className="space-y-2">
            <h4 className="text-base font-medium text-foreground/60">Resources</h4>
            <nav className="space-y-1" aria-label="Learning resources">
              <Link href="/learn/spreads" className="block text-xs text-muted-foreground transition-colors hover:text-foreground/80">
                Spreads
              </Link>
              <Link href="/learn/history" className="block text-xs text-muted-foreground transition-colors hover:text-foreground/80">
                History
              </Link>
            </nav>
          </div>

          {/* Legal */}
          <div className="space-y-2">
            <h4 className="text-base font-medium text-foreground/60">Legal</h4>
            <nav className="space-y-1" aria-label="Legal and privacy">
              <Link href="/privacy" className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground/80">
                <Shield className="h-3 w-3 flex-shrink-0" />
                Privacy
              </Link>
              <Link href="/terms" className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground/80">
                <Eye className="h-3 w-3 flex-shrink-0" />
                Terms
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
         <div className="border-t border-border/50 pt-4">
           <div className="flex flex-col items-center justify-center gap-3 text-xs text-muted-foreground/70">
             <p>© {currentYear} Lenormand Intelligence</p>
             <div className="flex items-center gap-1">
               <span>Made with</span>
               <Heart className="h-3 w-3 text-primary/60" aria-hidden="true" />
               <span>in Denmark</span>
             </div>
             <p className="text-xs text-muted-foreground/60">Entertainment & spiritual guidance</p>
           </div>
         </div>
      </div>
    </footer>
  )
}

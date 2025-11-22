"use client"

import Link from 'next/link'
import { Heart, Shield, Eye } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-12">
        {/* Footer Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* About */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">About</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Lenormand Intelligence brings ancient card wisdom to modern seekers through AI-enhanced interpretations.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Quick Links</h3>
            <nav className="space-y-2" aria-label="Quick navigation">
              <Link href="/read/new" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                New Reading
              </Link>
              <Link href="/cards" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Explore Cards
              </Link>
              <Link href="/learn/reading-basics" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Learn to Read
              </Link>
            </nav>
          </div>

          {/* Learn More */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Learn</h3>
            <nav className="space-y-2" aria-label="Learning resources">
              <Link href="/learn/introduction" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Introduction
              </Link>
              <Link href="/learn/spreads" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Spreads Guide
              </Link>
              <Link href="/learn/history" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Card History
              </Link>
            </nav>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Legal</h3>
            <nav className="space-y-2" aria-label="Legal and privacy">
              <Link href="/privacy" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Shield className="h-4 w-4 flex-shrink-0" />
                Privacy Policy
              </Link>
              <Link href="/terms" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Eye className="h-4 w-4 flex-shrink-0" />
                Terms of Service
              </Link>
            </nav>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/50" />

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {currentYear} Lenormand Intelligence. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-primary" aria-hidden="true" />
            <span>for divination enthusiasts</span>
          </div>
          <p className="text-xs">For entertainment and spiritual guidance only</p>
        </div>
      </div>
    </footer>
  )
}

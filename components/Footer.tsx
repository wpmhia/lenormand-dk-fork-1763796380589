"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { BookOpen, Heart, Shield, Sparkles, Eye } from 'lucide-react'
import { LenormandGuide } from '@/components/LenormandGuide'

export function Footer() {
  const [showGuide, setShowGuide] = useState(false)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <>
      <footer className="mt-auto border-t border-border bg-card backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          {/* Main Footer Content */}
          <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-3">
            
             {/* Brand Section */}
             <div className="space-y-4">
               <div className="flex items-center gap-2">
                 <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
                  <div className="text-lg font-bold leading-normal sm:text-xl lg:text-2xl" style={{ fontFamily: "'Crimson Pro', 'Crimson Text', serif" }}>
                    <span className="relative inline-block">
                      Lenormand
                      <div className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-gradient-to-r from-primary via-primary/80 to-primary/60 opacity-80"></div>
                    </span>
                    <span className="block bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                      Intelligence
                    </span>
                  </div>
               </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Mystical Card Wisdom for modern seekers. Discover guidance through the ancient art of Lenormand divination.
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>Made with</span>
                <Heart className="h-3 w-3 text-primary" aria-hidden="true" />
                <span>for divination enthusiasts</span>
              </div>
            </div>

            {/* Navigation Section */}
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">Navigation</h4>
              <nav className="space-element" aria-label="Main navigation">
                <Link 
                  href="/read/new" 
                  className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Start a new Lenormand reading analysis"
                >
                  New Analysis
                </Link>
                <Link 
                  href="/cards" 
                  className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Explore all Lenormand cards and their meanings"
                >
                  Explore Cards
                </Link>
                 <Link
                   href="/learn/reading-basics"
                   className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                   aria-label="Learn how to read Lenormand cards"
                 >
                   How to Read
                 </Link>
              </nav>
            </div>

            {/* Legal & Privacy Section */}
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">Legal & Privacy</h4>
              <nav className="space-element" aria-label="Legal and privacy links">
                <Link 
                  href="/privacy" 
                  className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Read our privacy policy and data protection practices"
                >
                  <Shield className="h-4 w-4" />
                  Privacy Policy
                </Link>
                <Link 
                  href="/terms" 
                  className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Read our terms of service and usage guidelines"
                >
                  <Eye className="h-4 w-4" />
                  Terms of Service
                </Link>
              </nav>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-border pt-6">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
               <div className="text-sm text-muted-foreground">
                 © 2025 Lenormand Intelligence
               </div>
              
              <div className="text-xs text-muted-foreground">
                For entertainment and spiritual guidance purposes only
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Guide Dialog */}
      <Dialog open={showGuide} onOpenChange={setShowGuide}>
          <DialogContent 
            className="max-h-[80vh] max-w-4xl overflow-y-auto border-border bg-card text-foreground"
            aria-labelledby="guide-dialog-title"
            id="lenormand-guide-dialog"
          >
          <DialogHeader>
            <DialogTitle 
              id="guide-dialog-title"
              className="flex items-center gap-2 text-foreground"
            >
              <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
              How to Read Lenormand Cards
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4" role="document">
            <LenormandGuide darkTheme={isDark} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
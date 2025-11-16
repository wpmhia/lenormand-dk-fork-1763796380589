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
      <footer className="border-t border-border bg-card backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4 py-8">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            
             {/* Brand Section */}
             <div className="space-y-4">
               <div className="flex items-center gap-2">
                 <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold leading-normal" style={{ fontFamily: "'Crimson Pro', 'Crimson Text', serif" }}>
                    <span className="relative inline-block">
                      Lenormand
                      <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-primary/80 to-primary/60 rounded-full opacity-80"></div>
                    </span>
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary/60">
                      Intelligence
                    </span>
                  </div>
               </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Mystical Card Wisdom for modern seekers. Discover guidance through the ancient art of Lenormand divination.
              </p>
              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                <span>Made with</span>
                <Heart className="w-3 h-3 text-primary" aria-hidden="true" />
                <span>for divination enthusiasts</span>
              </div>
            </div>

            {/* Navigation Section */}
            <div className="space-y-4">
              <h4 className="text-foreground font-medium">Navigation</h4>
              <nav className="space-element" aria-label="Main navigation">
                <Link 
                  href="/read/new" 
                  className="block text-muted-foreground hover:text-foreground text-sm transition-colors"
                  aria-label="Start a new Lenormand reading analysis"
                >
                  New Analysis
                </Link>
                <Link 
                  href="/cards" 
                  className="block text-muted-foreground hover:text-foreground text-sm transition-colors"
                  aria-label="Explore all Lenormand cards and their meanings"
                >
                  Explore Cards
                </Link>
                 <Link
                   href="/learn/reading-basics"
                   className="block text-muted-foreground hover:text-foreground text-sm transition-colors"
                   aria-label="Learn how to read Lenormand cards"
                 >
                   How to Read
                 </Link>
              </nav>
            </div>

            {/* Legal & Privacy Section */}
            <div className="space-y-4">
              <h4 className="text-foreground font-medium">Legal & Privacy</h4>
              <nav className="space-element" aria-label="Legal and privacy links">
                <Link 
                  href="/privacy" 
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors"
                  aria-label="Read our privacy policy and data protection practices"
                >
                  <Shield className="w-4 h-4" />
                  Privacy Policy
                </Link>
                <Link 
                  href="/terms" 
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors"
                  aria-label="Read our terms of service and usage guidelines"
                >
                  <Eye className="w-4 h-4" />
                  Terms of Service
                </Link>
              </nav>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-border pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
               <div className="text-muted-foreground text-sm">
                 © 2025 Lenormand Intelligence
               </div>
              
              <div className="text-muted-foreground text-xs">
                For entertainment and spiritual guidance purposes only
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Guide Dialog */}
      <Dialog open={showGuide} onOpenChange={setShowGuide}>
          <DialogContent 
            className="bg-card border-border max-w-4xl max-h-[80vh] overflow-y-auto text-foreground"
            aria-labelledby="guide-dialog-title"
            id="lenormand-guide-dialog"
          >
          <DialogHeader>
            <DialogTitle 
              id="guide-dialog-title"
              className="text-foreground flex items-center gap-2"
            >
              <BookOpen className="w-5 h-5 text-primary" aria-hidden="true" />
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
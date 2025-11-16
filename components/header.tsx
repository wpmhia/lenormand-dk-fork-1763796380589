"use client"

import Link from 'next/link';
import { Sparkles, Home, BookOpen, Plus, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      {/* Beta Banner */}
      <div className="w-full bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-b border-primary/20 py-1">
        <div className="container flex justify-center items-center px-4">
          <p className="text-xs text-primary font-medium text-center">
            ✨ Free during Beta - Your feedback shapes the future
          </p>
        </div>
      </div>

      <header className="z-50 w-full border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-14 items-center px-4">
        <div className="flex items-center space-x-2">
           <Link href="/" className="text-base sm:text-lg font-bold leading-normal hover:opacity-80 transition-opacity" style={{ fontFamily: "'Crimson Pro', 'Crimson Text', serif" }}>
             <span className="relative inline-block">
               Lenormand
               <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-primary/80 to-primary/60 rounded-full opacity-80"></div>
             </span>
             <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary/60">
               Intelligence
             </span>
           </Link>
         </div>
        <nav className="hidden md:flex items-center space-x-6 ml-auto" role="navigation">
          <Link
            href="/"
            className="flex items-center space-x-1 text-sm font-medium text-card-foreground hover:text-primary transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>
           <Link
             href="/cards"
             className="flex items-center space-x-1 text-sm font-medium text-card-foreground hover:text-primary transition-colors"
           >
             <BookOpen className="w-4 h-4" />
             <span>Cards</span>
           </Link>
            <button
              onClick={() => router.push('/read/new?reset=' + Date.now())}
              className="flex items-center space-x-1 text-sm font-medium text-card-foreground hover:text-primary transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Reading</span>
            </button>
          <Link
            href="/learn"
            className="flex items-center space-x-1 text-sm font-medium text-card-foreground hover:text-primary transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Learn</span>
          </Link>
        </nav>

        <div className="flex items-center space-x-2 ml-auto md:ml-0">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-3 text-card-foreground hover:text-primary transition transform duration-150 ease-out hover:-translate-y-[1px] active:scale-95"
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <ThemeToggle />
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="md:hidden border-t border-border bg-card/95 backdrop-blur overflow-hidden"
          >
            <nav className="container px-4 py-4 space-y-2" role="navigation">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2 text-sm font-medium text-card-foreground hover:text-primary transition-colors py-3"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
            <Link
              href="/cards"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2 text-sm font-medium text-card-foreground hover:text-primary transition-colors py-3"
            >
              <BookOpen className="w-4 h-4" />
              <span>Cards</span>
            </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  router.push('/read/new?reset=' + Date.now());
                }}
                className="flex items-center space-x-2 text-sm font-medium text-card-foreground hover:text-primary transition-colors py-3"
              >
                <Plus className="w-4 h-4" />
                <span>New Reading</span>
              </button>
            <Link
              href="/learn"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2 text-sm font-medium text-card-foreground hover:text-primary transition-colors py-3"
            >
              <Sparkles className="w-4 h-4" />
              <span>Learn</span>
            </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
    </>
  );
}
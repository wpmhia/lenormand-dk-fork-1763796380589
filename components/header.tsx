"use client"

import Link from 'next/link';
import { Sparkles, Home, BookOpen, Plus, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';


export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <header className="z-50 w-full border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-14 items-center px-4">
        <div className="flex items-center space-x-2">
           <Link href="/" className="text-base font-bold leading-normal transition-opacity hover:opacity-80 sm:text-lg" style={{ fontFamily: "'Crimson Pro', 'Crimson Text', serif" }}>
             <span className="relative inline-block">
               Lenormand
               <div className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-gradient-to-r from-primary via-primary/80 to-primary/60 opacity-80"></div>
             </span>
             <span className="block bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
               Intelligence
             </span>
           </Link>
         </div>
         <nav className="ml-auto hidden items-center space-x-6 md:flex" role="navigation">
           <Link
             href="/"
             className="flex items-center space-x-1 text-sm font-medium text-card-foreground transition-colors hover:text-primary"
           >
             <Home className="h-4 w-4" />
             <span>Home</span>
           </Link>
            <Link
              href="/cards"
              className="flex items-center space-x-1 text-sm font-medium text-card-foreground transition-colors hover:text-primary"
            >
              <BookOpen className="h-4 w-4" />
              <span>Cards</span>
            </Link>
             <button
               onClick={() => router.push('/read/new?reset=' + Date.now())}
               className="flex items-center space-x-1 text-sm font-medium text-card-foreground transition-colors hover:text-primary"
             >
               <Plus className="h-4 w-4" />
               <span>New Reading</span>
             </button>
           <Link
             href="/learn"
             className="flex items-center space-x-1 text-sm font-medium text-card-foreground transition-colors hover:text-primary"
           >
             <Sparkles className="h-4 w-4" />
             <span>Learn</span>
           </Link>
           <a href='https://ko-fi.com/Y8Y81NVDEK' target='_blank' rel='noopener noreferrer' className="inline-block transition-transform hover:scale-105 active:scale-95">
             <img height='36' style={{border: '0px', height: '36px'}} src='https://storage.ko-fi.com/cdn/kofi1.png?v=6' alt='Buy Me a Coffee at ko-fi.com' />
           </a>
         </nav>

          <div className="md:hidden">
           {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="transform p-2.5 text-card-foreground transition duration-150 ease-out hover:-translate-y-[1px] hover:text-primary active:scale-95 md:hidden"
              aria-label="Toggle mobile menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
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
            className="overflow-hidden border-t border-border bg-card/95 backdrop-blur md:hidden"
          >
            <nav className="container space-y-1 px-4 py-3" role="navigation">
             <Link
               href="/"
               onClick={() => setMobileMenuOpen(false)}
               className="flex items-center space-x-2 rounded px-2 py-3 text-sm font-medium text-card-foreground transition-colors hover:text-primary"
             >
               <Home className="h-4 w-4" />
               <span>Home</span>
             </Link>
             <Link
               href="/cards"
               onClick={() => setMobileMenuOpen(false)}
               className="flex items-center space-x-2 rounded px-2 py-3 text-sm font-medium text-card-foreground transition-colors hover:text-primary"
             >
               <BookOpen className="h-4 w-4" />
               <span>Cards</span>
             </Link>
               <button
                 onClick={() => {
                   setMobileMenuOpen(false);
                   router.push('/read/new?reset=' + Date.now());
                 }}
                 className="flex w-full items-center space-x-2 rounded px-2 py-3 text-sm font-medium text-card-foreground transition-colors hover:text-primary"
               >
                 <Plus className="h-4 w-4" />
                 <span>New Reading</span>
               </button>
             <Link
               href="/learn"
               onClick={() => setMobileMenuOpen(false)}
               className="flex items-center space-x-2 rounded px-2 py-3 text-sm font-medium text-card-foreground transition-colors hover:text-primary"
             >
               <Sparkles className="h-4 w-4" />
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
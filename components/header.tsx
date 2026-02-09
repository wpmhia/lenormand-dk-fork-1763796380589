"use client";

import Link from "next/link";
import { Sparkles, Home, BookOpen, Plus, Menu, X, Heart } from "lucide-react";
import { useState } from "react";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-14 items-center px-4">
        <div className="flex items-center space-x-2">
          <Link
            href="/"
            className="logo-font text-sm font-bold leading-tight transition-opacity hover:opacity-80 sm:text-base md:text-lg"
          >
            <span className="relative inline-block">
              Lenormand
              <div className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-gradient-to-r from-primary via-primary/80 to-primary/60 opacity-80"></div>
            </span>
            <span className="block bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Intelligence
            </span>
          </Link>
        </div>
        <nav
          className="ml-auto hidden items-center gap-2 md:flex"
          role="navigation"
        >
          <Link
            href="/"
            className="flex min-h-11 min-w-11 items-center gap-1.5 rounded px-2.5 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-accent/50 hover:text-primary"
          >
            <Home className="h-5 w-5" />
            <span>Home</span>
          </Link>
          <Link
            href="/cards"
            className="flex min-h-11 min-w-11 items-center gap-1.5 rounded px-2.5 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-accent/50 hover:text-primary"
          >
            <BookOpen className="h-5 w-5" />
            <span>Cards</span>
          </Link>
           <Link
             href="/read/new?reset=true"
             className="flex min-h-11 min-w-11 items-center gap-1.5 rounded px-2.5 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-accent/50 hover:text-primary"
           >
             <Plus className="h-5 w-5" />
             <span>New Reading</span>
           </Link>
          <Link
            href="/learn"
            className="flex min-h-11 min-w-11 items-center gap-1.5 rounded px-2.5 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-accent/50 hover:text-primary"
          >
            <Sparkles className="h-5 w-5" />
            <span>Learn</span>
          </Link>
          <a
            href="https://ko-fi.com/Y8Y81NVDEK"
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 min-w-11 items-center gap-1.5 rounded px-2.5 py-2 text-sm font-medium text-primary transition-colors hover:bg-accent/50 hover:text-primary"
          >
            <Heart className="h-5 w-5" />
            <span>Support</span>
          </a>
        </nav>
        <div className="ml-auto md:hidden">
          <button
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded text-card-foreground transition duration-150 ease-out hover:-translate-y-[1px] hover:text-primary active:scale-95"
            aria-label={mobileMenuOpen ? "Close mobile menu" : "Open mobile menu"}
            aria-expanded={mobileMenuOpen}
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-card px-4 py-4 md:hidden">
          <nav className="flex flex-col space-y-2" role="navigation">
            <Link
              href="/"
              className="flex min-h-11 items-center gap-2 rounded px-3 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-accent/50 hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Home className="h-5 w-5" />
              <span>Home</span>
            </Link>
            <Link
              href="/cards"
              className="flex min-h-11 items-center gap-2 rounded px-3 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-accent/50 hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              <BookOpen className="h-5 w-5" />
              <span>Cards</span>
            </Link>
             <Link
               href="/read/new?reset=true"
               className="flex min-h-11 items-center gap-2 rounded px-3 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-accent/50 hover:text-primary"
               onClick={() => setMobileMenuOpen(false)}
             >
               <Plus className="h-5 w-5" />
               <span>New Reading</span>
             </Link>
            <Link
              href="/learn"
              className="flex min-h-11 items-center gap-2 rounded px-3 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-accent/50 hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Sparkles className="h-5 w-5" />
              <span>Learn</span>
            </Link>
            <a
              href="https://ko-fi.com/Y8Y81NVDEK"
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center gap-2 rounded px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-accent/50 hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Heart className="h-5 w-5" />
              <span>Support</span>
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

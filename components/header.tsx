"use client";

import Link from "next/link";
import Image from "next/image";
import { Sparkles, Home, BookOpen, Plus, Menu, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  return (
    <header
      className="z-50 w-full border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60"
      suppressHydrationWarning
    >
      <div className="container flex h-14 items-center px-4">
        <div className="flex items-center space-x-2">
          <Link
            href="/"
            className="logo-font text-base font-bold leading-normal transition-opacity hover:opacity-80 sm:text-lg"
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
          <button
            onClick={() => router.push("/read/new?reset=" + Date.now())}
            className="flex min-h-11 min-w-11 items-center gap-1.5 rounded px-2.5 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-accent/50 hover:text-primary"
          >
            <Plus className="h-5 w-5" />
            <span>New Reading</span>
          </button>
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
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded transition-transform hover:scale-105 active:scale-95"
          >
            <Image
              height={36}
              style={{ border: "0px", height: "36px" }}
              loading="lazy"
              src="https://storage.ko-fi.com/cdn/kofi1.png?v=6"
              alt="Buy Me a Coffee at ko-fi.com"
              width={108}
            />
          </a>
        </nav>

        <div className="ml-auto md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded text-card-foreground transition duration-150 ease-out hover:-translate-y-[1px] hover:text-primary active:scale-95"
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="border-t border-border bg-card/95 backdrop-blur md:hidden"
          role="navigation"
          aria-label="Mobile navigation"
        >
          <nav className="container space-y-2 px-4 py-3" role="navigation">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-11 min-w-11 items-center gap-2 rounded px-3 py-2.5 text-sm font-medium text-card-foreground transition-colors hover:bg-accent/50 hover:text-primary"
            >
              <Home className="h-5 w-5" />
              <span>Home</span>
            </Link>
            <Link
              href="/cards"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-11 min-w-11 items-center gap-2 rounded px-3 py-2.5 text-sm font-medium text-card-foreground transition-colors hover:bg-accent/50 hover:text-primary"
            >
              <BookOpen className="h-5 w-5" />
              <span>Cards</span>
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                router.push("/read/new?reset=" + Date.now());
              }}
              className="flex min-h-11 w-full items-center gap-2 rounded px-3 py-2.5 text-sm font-medium text-card-foreground transition-colors hover:bg-accent/50 hover:text-primary"
            >
              <Plus className="h-5 w-5" />
              <span>New Reading</span>
            </button>
            <Link
              href="/learn"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-11 min-w-11 items-center gap-2 rounded px-3 py-2.5 text-sm font-medium text-card-foreground transition-colors hover:bg-accent/50 hover:text-primary"
            >
              <Sparkles className="h-5 w-5" />
              <span>Learn</span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

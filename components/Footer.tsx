import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/70 bg-gradient-to-b from-background to-muted/20">
      <div className="container py-10 md:py-16">
        <div className="grid grid-cols-2 gap-x-6 gap-y-9 md:grid-cols-3 md:gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="group inline-flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                <Sparkles className="size-4" aria-hidden="true" />
              </span>
              <h3 className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-lg font-bold text-transparent">
                Lenormand
              </h3>
            </Link>
            <p className="mt-3 max-w-[18rem] text-xs leading-5 text-muted-foreground">
              AI-enhanced readings for curious minds and everyday questions.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Explore
            </h4>
            <ul className="space-y-2.5 text-sm">
               <li>
                  <Link href="/" className="text-muted-foreground transition-colors hover:text-primary">
                   Home
                 </Link>
               </li>
               <li>
                 <Link href="/read/new" className="text-muted-foreground transition-colors hover:text-primary">
                   Reading
                 </Link>
               </li>
               <li>
                 <Link href="/history" className="text-muted-foreground transition-colors hover:text-primary">
                   History
                 </Link>
               </li>
               <li>
                 <Link href="/cards" className="text-muted-foreground transition-colors hover:text-primary">
                   Cards
                 </Link>
               </li>
               <li>
                 <Link href="/learn" className="text-muted-foreground transition-colors hover:text-primary">
                   Learn
                 </Link>
               </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Links
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground transition-colors hover:text-primary">
                  About
                </Link>
              </li>
              <li>
                 <Link href="/support" className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-amber-500">
                   Support <ArrowUpRight className="size-3" aria-hidden="true" />
                 </Link>
              </li>
               <li>
                 <Link href="/how-readings-work" className="text-muted-foreground transition-colors hover:text-primary">
                   How readings work
                 </Link>
               </li>
               <li>
                 <Link href="/privacy" className="text-muted-foreground transition-colors hover:text-primary">
                   Privacy
                 </Link>
               </li>
              <li>
                <Link href="/terms" className="text-muted-foreground transition-colors hover:text-primary">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border/50 pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Made by <a href="https://humanstack.dk" className="underline underline-offset-2 transition-colors hover:text-foreground">Humanstack</a></p>
          <p>© {new Date().getFullYear()} Lenormand</p>
        </div>
      </div>
    </footer>
  );
}

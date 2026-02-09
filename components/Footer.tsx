import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background/50">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-3 gap-4 md:grid-cols-3 md:gap-8">
          <div className="col-span-1">
            <Link href="/" className="block">
              <h3 className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-lg font-bold text-transparent">
                Lenormand
              </h3>
            </Link>
            <p className="mt-1 text-[10px] text-muted-foreground">
              AI-Enhanced Divination
            </p>
          </div>

          <div>
            <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Explore
            </h4>
            <ul className="space-y-1 text-xs">
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
            <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Links
            </h4>
            <ul className="space-y-1 text-xs">
              <li>
                <Link href="/about" className="text-muted-foreground transition-colors hover:text-primary">
                  About
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

         <div className="mt-4 flex flex-col items-center justify-center gap-4 border-t border-border/50 pt-4">
           <a
             href="https://ko-fi.com/Y8Y81NVDEK"
             target="_blank"
             rel="noopener noreferrer"
             className="inline-flex items-center justify-center"
           >
             <Image
               width={144}
               height={36}
               style={{ border: 0, height: 36, width: "auto" }}
               src="https://storage.ko-fi.com/cdn/kofi6.png?v=6"
               alt="Buy Me a Coffee at ko-fi.com"
               unoptimized
             />
           </a>
            <div className="flex flex-col items-center justify-between gap-2 text-[10px] text-muted-foreground md:flex-row md:w-full">
             <span>© 2026 Lenormand Intelligence</span>
              <span className="flex items-center gap-1 whitespace-nowrap">
                Made by <a href="https://humanstack.dk/" rel="follow" className="text-primary/80 hover:text-primary transition-colors font-medium">Humanstack</a>
              </span>
           </div>
         </div>
      </div>
    </footer>
  );
}

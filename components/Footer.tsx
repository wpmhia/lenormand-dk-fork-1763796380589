import Link from "next/link";
import Image from "next/image";

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
            <p className="mt-1 text-xs text-muted-foreground">
              AI-Enhanced Divination
            </p>
            <div className="mt-4 flex flex-col items-start gap-1">
              <p className="text-xs text-muted-foreground">Powered by</p>
              <Image
                src="/images/mistral-ai-logo.png"
                alt="Mistral AI"
                width={120}
                height={40}
                className="h-5 w-auto"
              />
            </div>
          </div>

           <div>
             <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
               Explore
             </h4>
             <ul className="space-y-1.5 text-sm">
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
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Links
            </h4>
            <ul className="space-y-1.5 text-sm">
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
           <p className="text-xs text-muted-foreground">Made by <a href="https://humanstack.dk" className="underline">Humanstack</a></p>
         </div>
      </div>
    </footer>
  );
}

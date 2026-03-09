import { Button } from "@/components/ui/button";
import { Home, Search, BookOpen, Club } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Elegant 404 with subtle animation */}
        <div className="space-y-2">
          <h1 className="text-8xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent animate-pulse">
            404
          </h1>
          <p className="text-2xl font-semibold text-foreground">
            This page wandered off
          </p>
          <p className="text-muted-foreground">
            Sometimes even the cards lose their way. Let&apos;s get you back on track.
          </p>
        </div>

        {/* Helpful navigation options */}
        <div className="flex flex-col gap-3">
          <Link href="/" className="w-full">
            <Button className="w-full gap-2">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </Link>
          <div className="flex gap-3">
            <Link href="/cards" className="flex-1">
              <Button variant="outline" className="w-full gap-2">
                <Club className="h-4 w-4" />
                Cards
              </Button>
            </Link>
            <Link href="/learn" className="flex-1">
              <Button variant="outline" className="w-full gap-2">
                <BookOpen className="h-4 w-4" />
                Learn
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

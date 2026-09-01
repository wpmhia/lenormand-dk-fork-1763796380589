import { Button } from "@/components/ui/button";
import { Home, BookOpen, Club } from "lucide-react";
import Link from "next/link";
import { StatePage } from "@/components/StatePage";

export default function NotFound() {
  return (
    <StatePage
      icon={<div className="text-5xl font-bold text-primary">404</div>}
      title="This page wandered off"
      description="Sometimes even the cards lose their way. Let&apos;s get you back on track."
    >
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
    </StatePage>
  );
}

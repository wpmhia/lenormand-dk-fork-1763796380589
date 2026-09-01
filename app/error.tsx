"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, RefreshCw, BookOpen } from "lucide-react";
import { StatePage } from "@/components/StatePage";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("Error:", error, error.digest);
  }, [error]);

  return (
    <StatePage
      icon={<AlertCircle className="h-10 w-10" />}
      title="Something interrupted the reading"
      description="Even the best readings hit snags. Let&apos;s try again or start fresh."
    >
          <Button onClick={reset} className="w-full gap-2">
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          <div className="flex gap-3">
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="flex-1 gap-2"
            >
              <Home className="h-4 w-4" />
              Home
            </Button>
            <Button
              onClick={() => router.push("/learn")}
              variant="outline"
              className="flex-1 gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Learn
            </Button>
          </div>
    </StatePage>
  );
}

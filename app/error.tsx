"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, RefreshCw, BookOpen } from "lucide-react";

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
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-2">
          <AlertCircle className="mx-auto h-16 w-16 text-destructive" />
          <h1 className="text-2xl font-bold text-foreground">
            Something interrupted the reading
          </h1>
          <p className="text-muted-foreground">
            Even the best readings hit snags. Let&apos;s try again or start fresh.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={reset}
            className="w-full gap-2"
          >
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
        </div>
      </div>
    </div>
  );
}

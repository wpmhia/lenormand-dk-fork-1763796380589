"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("Cards error:", error, error.digest);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Cards Error</h1>
          <p className="text-muted-foreground">
            We encountered an error while loading the cards. Please try again.
          </p>
        </div>

        <div className="flex flex-col justify-center gap-3">
          <Button
            onClick={reset}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </Button>
          <Button variant="outline" onClick={() => router.push("/")}>
            Go home
          </Button>
        </div>
      </div>
    </div>
  );
}

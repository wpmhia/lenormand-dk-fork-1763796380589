"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";

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
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="text-2xl font-bold text-foreground">
            Something went wrong
          </h1>
          <p className="text-muted-foreground">
            We encountered an unexpected error.
          </p>
        </div>

        <div className="flex flex-col justify-center gap-3">
          <Button
            onClick={reset}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </Button>
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="border-border hover:bg-muted"
          >
            <Home className="mr-2 h-4 w-4" />
            Go home
          </Button>
        </div>
      </div>
    </div>
  );
}

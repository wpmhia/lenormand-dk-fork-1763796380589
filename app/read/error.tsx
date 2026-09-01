"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Home, RefreshCw } from "lucide-react";
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
    console.error("Reading error:", error, error.digest);
  }, [error]);

  return (
    <StatePage
      icon={<AlertCircle className="h-10 w-10" />}
      title="Reading Error"
      description="We encountered an error while loading your reading. Please try again."
      detail={error.digest ? <p className="text-xs text-muted-foreground/60">Error ID: {error.digest}</p> : undefined}
    >
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Home className="h-4 w-4" />
            Go home
          </button>
    </StatePage>
  );
}

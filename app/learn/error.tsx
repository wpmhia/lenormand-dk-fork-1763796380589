"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
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
    console.error("Learn page error:", error, error.digest);
  }, [error]);

  return (
    <StatePage
      icon={<AlertTriangle className="h-10 w-10" />}
      title="Learning Error"
      description="We encountered an error while loading the learning content. Please try again."
      detail={process.env.NODE_ENV === "development" ? (
        <details className="mt-6 text-left">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">Error details (development only)</summary>
          <pre className="mt-2 overflow-auto rounded bg-muted p-3 text-xs">{error.message}{error.stack && `\n\n${error.stack}`}</pre>
        </details>
      ) : undefined}
    >
          <Button onClick={reset} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Go home
          </Button>
    </StatePage>
  );
}

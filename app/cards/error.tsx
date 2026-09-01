"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
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
    console.error("Cards error:", error, error.digest);
  }, [error]);

  return (
    <StatePage title="Cards Error" description="We encountered an error while loading the cards. Please try again.">
          <Button
            onClick={reset}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </Button>
          <Button variant="outline" onClick={() => router.push("/")}>
            Go home
          </Button>
    </StatePage>
  );
}

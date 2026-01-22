"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

interface RedirectClientProps {
  searchParams: Promise<{
    to?: string;
    code?: string;
    permanent?: string;
  }>;
}

const redirectMap: Record<string, string> = {
  reading: "/read/new",
  cards: "/cards",
  learn: "/learn",
  about: "/about",
  privacy: "/privacy",
  terms: "/terms",
  home: "/",
};

function RedirectContent({ searchParams }: RedirectClientProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const params = useSearchParams();

  useEffect(() => {
    const handleRedirect = async () => {
      const resolvedParams = await searchParams;
      const destination = params.get("to") || resolvedParams.to;
      const redirectCode = params.get("code") || resolvedParams.code;
      const isPermanent = params.get("permanent") || resolvedParams.permanent;

      if (!destination && !redirectCode) {
        setError("No redirect destination provided");
        return;
      }

      let url: string;

      if (redirectCode) {
        const resolvedUrl = redirectMap[redirectCode];
        if (!resolvedUrl) {
          setError("Invalid redirect code");
          return;
        }
        url = resolvedUrl;
      } else if (destination) {
        try {
          url = new URL(destination).toString();
        } catch {
          setError("Invalid URL provided");
          return;
        }
      } else {
        setError("No redirect destination found");
        return;
      }

      const timeout = setTimeout(() => {
        if (isPermanent === "true" || isPermanent === "1") {
          router.replace(url);
        } else {
          router.push(url);
        }
      }, 1500);

      return () => clearTimeout(timeout);
    };

    handleRedirect();
  }, [params, searchParams, router]);

  const resolvedParams = useSearchParams();
  const destination = params.get("to") || resolvedParams.get("to");
  const isPermanent =
    params.get("permanent") || resolvedParams.get("permanent");

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-foreground">
            Redirect Error
          </h1>
          <p className="mb-4 text-muted-foreground">{error}</p>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Return Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="text-center">
        <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          {isPermanent === "true" || isPermanent === "1"
            ? "Permanent Redirect"
            : "Redirecting..."}
        </h1>
        <p className="mb-4 text-muted-foreground">You will be redirected to</p>
        <p className="mx-auto max-w-md break-all font-mono text-sm text-primary">
          {destination || "Destination"}
        </p>
        {isPermanent === "true" || isPermanent === "1" ? (
          <p className="mt-4 text-xs text-muted-foreground">
            This is a permanent redirect (301)
          </p>
        ) : (
          <p className="mt-4 text-xs text-muted-foreground">
            If you are not redirected,{" "}
            <a
              href={destination || "/"}
              className="text-primary hover:underline"
            >
              click here
            </a>
          </p>
        )}
      </div>
    </div>
  );
}

export default function RedirectClient(props: RedirectClientProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <RedirectContent {...props} />
    </Suspense>
  );
}

"use client";

import { useEffect } from "react";
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
          <p className="text-gray-600">
            We encountered an error while loading the cards. Please try again.
          </p>
        </div>

        <div className="flex flex-col justify-center gap-3">
          <button
            onClick={reset}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Try again
          </button>
          <button
            onClick={() => router.push("/")}
            className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-50"
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  );
}

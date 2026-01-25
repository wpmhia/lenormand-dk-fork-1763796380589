"use client";

import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">404</h1>
          <p className="text-xl font-semibold">Page not found</p>
          <p className="text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
        <Link href="/">
          <Button className="w-full">
            <Home className="mr-2 h-4 w-4" />
            Go home
          </Button>
        </Link>
      </div>
    </div>
  );
}

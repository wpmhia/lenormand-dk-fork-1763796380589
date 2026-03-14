"use client";

import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { authClient } from "@/lib/auth-client";
import { MembershipProvider } from "@/components/MembershipProvider";

function LinkComponent({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return (
    <NextLink href={href} className={className}>
      {children}
    </NextLink>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <AuthUIProvider
      authClient={authClient}
      navigate={router.push}
      replace={router.replace}
      onSessionChange={() => router.refresh()}
      Link={LinkComponent}
    >
      <MembershipProvider>
        {children}
      </MembershipProvider>
    </AuthUIProvider>
  );
}

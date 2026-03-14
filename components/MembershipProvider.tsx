"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useSession } from "@/lib/auth-client";

interface MembershipContextValue {
  isMember: boolean;
  isLoading: boolean;
  tier: "free" | "unlimited";
  expiresAt: string | null;
  refreshMembership: () => Promise<void>;
}

const MembershipContext = createContext<MembershipContextValue>({
  isMember: false,
  isLoading: true,
  tier: "free",
  expiresAt: null,
  refreshMembership: async () => {},
});

export function MembershipProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();
  const [isMember, setIsMember] = useState(false);
  const [tier, setTier] = useState<"free" | "unlimited">("free");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkMembership = useCallback(async () => {
    if (!session?.user) {
      setIsMember(false);
      setTier("free");
      setExpiresAt(null);
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/vip/status");
      if (res.ok) {
        const data = await res.json();
        setIsMember(data.isMember ?? false);
        setTier(data.tier ?? "free");
        setExpiresAt(data.expiresAt ?? null);
      }
    } catch {
      setIsMember(false);
      setTier("free");
    } finally {
      setIsLoading(false);
    }
  }, [session?.user]);

  useEffect(() => {
    if (!isPending) {
      checkMembership();
    }
  }, [isPending, checkMembership]);

  return (
    <MembershipContext.Provider value={{ isMember, isLoading, tier, expiresAt, refreshMembership: checkMembership }}>
      {children}
    </MembershipContext.Provider>
  );
}

export function useMembership() {
  return useContext(MembershipContext);
}

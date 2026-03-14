"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useSession } from "@/lib/auth-client";

interface SupporterContextValue {
  isSupporter: boolean;
  isLoading: boolean;
  refreshSupporter: () => Promise<void>;
}

const SupporterContext = createContext<SupporterContextValue>({
  isSupporter: false,
  isLoading: true,
  refreshSupporter: async () => {},
});

export function SupporterProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();
  const [isSupporter, setIsSupporter] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkSupporter = useCallback(async () => {
    if (!session?.user) {
      setIsSupporter(false);
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/vip/status");
      if (res.ok) {
        const data = await res.json();
        setIsSupporter(data.isVip ?? false);
      }
    } catch {
      setIsSupporter(false);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user]);

  useEffect(() => {
    if (!isPending) {
      checkSupporter();
    }
  }, [isPending, checkSupporter]);

  return (
    <SupporterContext.Provider value={{ isSupporter, isLoading, refreshSupporter: checkSupporter }}>
      {children}
    </SupporterContext.Provider>
  );
}

export function useSupporter() {
  return useContext(SupporterContext);
}

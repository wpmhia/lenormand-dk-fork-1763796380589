"use client";

import { createContext, useContext, ReactNode } from "react";
import { useSupporterStatus, SupporterStatus } from "@/hooks/use-supporter";

const SupporterContext = createContext<SupporterStatus>({
  isSupporter: false,
  code: null,
});

export function SupporterProvider({ children }: { children: ReactNode }) {
  const { status } = useSupporterStatus();
  return (
    <SupporterContext.Provider value={status}>
      {children}
    </SupporterContext.Provider>
  );
}

export function useSupporter() {
  return useContext(SupporterContext);
}

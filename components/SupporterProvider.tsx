"use client";

import { createContext, useContext, ReactNode } from "react";
import { useSupporterStatus, SupporterStatus } from "@/hooks/use-supporter";

interface SupporterContextValue extends SupporterStatus {
  redeemCode: (code: string) => boolean;
  clearStatus: () => void;
}

const SupporterContext = createContext<SupporterContextValue>({
  isSupporter: false,
  code: null,
  redeemCode: () => false,
  clearStatus: () => {},
});

export function SupporterProvider({ children }: { children: ReactNode }) {
  const { status, redeemCode, clearStatus } = useSupporterStatus();
  return (
    <SupporterContext.Provider value={{ ...status, redeemCode, clearStatus }}>
      {children}
    </SupporterContext.Provider>
  );
}

export function useSupporter() {
  return useContext(SupporterContext);
}

"use client";

import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "lenormand_supporter_code";
const VALID_CODES = ["LENORMAND-PLUS", "THANKYOU", "SUPPORT2026"];

export interface SupporterStatus {
  isSupporter: boolean;
  code: string | null;
}

function getInitialStatus(): SupporterStatus {
  if (typeof window === "undefined") {
    return { isSupporter: false, code: null };
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && VALID_CODES.includes(stored.toUpperCase())) {
    return { isSupporter: true, code: stored.toUpperCase() };
  }
  return { isSupporter: false, code: null };
}

export function useSupporterStatus() {
  const [status, setStatus] = useState<SupporterStatus>(getInitialStatus);

  const redeemCode = useCallback((code: string): boolean => {
    const normalizedCode = code.trim().toUpperCase();
    if (VALID_CODES.includes(normalizedCode)) {
      localStorage.setItem(STORAGE_KEY, normalizedCode);
      setStatus({ isSupporter: true, code: normalizedCode });
      return true;
    }
    return false;
  }, []);

  const clearStatus = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setStatus({ isSupporter: false, code: null });
  }, []);

  return { status, redeemCode, clearStatus };
}

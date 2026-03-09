"use client";

import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "lenormand_supporter_code";
const VALID_CODES = ["LENORMAND-PLUS", "THANKYOU", "SUPPORT2024"];

export interface SupporterStatus {
  isSupporter: boolean;
  code: string | null;
}

export function useSupporterStatus() {
  const [status, setStatus] = useState<SupporterStatus>({
    isSupporter: false,
    code: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && VALID_CODES.includes(stored.toUpperCase())) {
      setStatus({ isSupporter: true, code: stored.toUpperCase() });
    }
    setIsLoading(false);
  }, []);

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

  return { status, isLoading, redeemCode, clearStatus };
}

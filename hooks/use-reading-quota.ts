"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/lib/auth-client";

interface ReadingQuota {
  used: number;
  limit: number;
  remaining: number;
  isVip: boolean;
}

export function useReadingQuota() {
  const { data: session } = useSession();
  const [quota, setQuota] = useState<ReadingQuota>({
    used: 0,
    limit: 1,
    remaining: 1,
    isVip: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchQuota = useCallback(async () => {
    if (!session?.user) {
      setQuota({ used: 0, limit: 1, remaining: 0, isVip: false });
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/vip/status");
      if (res.ok) {
        const data = await res.json();
        setQuota({
          used: data.usage?.count || 0,
          limit: 1,
          remaining: data.isVip ? Infinity : Math.max(0, 1 - (data.usage?.count || 0)),
          isVip: data.isVip || false,
        });
      }
    } catch {
      // Silent fail - quota not critical
    } finally {
      setIsLoading(false);
    }
  }, [session?.user]);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  return { quota, isLoading, refreshQuota: fetchQuota };
}

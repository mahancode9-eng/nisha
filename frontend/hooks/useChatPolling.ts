"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseChatPollingOptions<T> = {
  fetchFn: () => Promise<T>;
  intervalMs?: number;
  enabled?: boolean;
};

export function useChatPolling<T>({
  fetchFn,
  intervalMs = 4000,
  enabled = true,
}: UseChatPollingOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;
  const cancelledRef = useRef(false);

  const refetch = useCallback(async () => {
    try {
      const result = await fetchFnRef.current();
      if (!cancelledRef.current) {
        setData(result);
        setError(null);
      }
      return result;
    } catch (err) {
      if (!cancelledRef.current) {
        setError(err instanceof Error ? err.message : "بارگذاری ممکن نشد");
      }
      return null;
    } finally {
      if (!cancelledRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    if (!enabled) return;
    void refetch();

    const tick = () => {
      if (document.visibilityState === "hidden" || cancelledRef.current) return;
      void refetch();
    };

    const id = setInterval(tick, intervalMs);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && !cancelledRef.current) {
        void refetch();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelledRef.current = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled, intervalMs, refetch]);

  return { data, error, isLoading, refetch, setData };
}

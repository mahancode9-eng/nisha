"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api/errors";

export function useSellerFetch<T>(fetchFn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const requestIdRef = useRef(0);
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const refetch = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchFnRef.current();
      if (requestId !== requestIdRef.current) return null;
      setData(result);
      return result;
    } catch (err) {
      if (requestId !== requestIdRef.current) return null;
      const message = err instanceof ApiError ? err.message : "اطلاعات باز نشد. دوباره امتحان کن.";
      setError(message);
      setData(null);
      return null;
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    void refetch();
    return () => {
      // Invalidate in-flight responses from this effect cycle.
      requestIdRef.current += 1;
    };
  }, [refetch]);

  return { data, error, isLoading, refetch, setData };
}

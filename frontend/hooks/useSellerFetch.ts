"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api/errors";

export function useSellerFetch<T>(fetchFn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const cancelledRef = useRef(false);
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const refetch = useCallback(async () => {
    if (cancelledRef.current) return null;
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchFnRef.current();
      if (!cancelledRef.current) {
        setData(result);
      }
      return result;
    } catch (err) {
      if (!cancelledRef.current) {
        const message = err instanceof ApiError ? err.message : "Something went wrong";
        setError(message);
        setData(null);
      }
      return null;
    } finally {
      if (!cancelledRef.current) {
        setIsLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    cancelledRef.current = false;
    void refetch();
    return () => {
      cancelledRef.current = true;
    };
  }, [refetch]);

  return { data, error, isLoading, refetch, setData };
}

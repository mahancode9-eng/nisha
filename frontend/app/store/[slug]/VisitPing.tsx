"use client";

import { useEffect } from "react";
import { apiPost } from "@/lib/api/client";

export function VisitPing({ slug }: { slug: string }) {
  useEffect(() => {
    apiPost<void>(`/api/v1/public/stores/${slug}/visit`, undefined, { auth: false }).catch(
      () => {
        // Analytics ping failures are non-critical.
      },
    );
  }, [slug]);

  return null;
}

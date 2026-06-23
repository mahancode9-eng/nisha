"use client";

import { Suspense } from "react";
import CustomerLoginForm from "./CustomerLoginForm";
import { LoadingState } from "@/components/ui/LoadingState";

export default function CustomerLoginPage() {
  return (
    <Suspense fallback={<LoadingState message="در حال بارگذاری…" />}>
      <CustomerLoginForm />
    </Suspense>
  );
}

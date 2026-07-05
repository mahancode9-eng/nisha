export type HealthResponse = {
  status: string;
  database: string;
};

export * from "@/types/auth";
export * from "@/types/order";
export * from "@/types/seller/dashboard";
export * from "@/types/seller/store";
export * from "@/types/seller/product";
export * from "@/types/seller/payment-method";
export * from "@/types/seller/order";
export * from "@/types/seller/onboarding";
export * from "@/types/public/store";
export * from "@/types/public/checkout";
export * from "@/types/public/order";
export * from "@/types/customer/profile";
export * from "@/types/customer/recovery";
export * from "@/types/customer/order";

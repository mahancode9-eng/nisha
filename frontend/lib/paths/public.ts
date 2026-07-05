export const publicPaths = {
  store: (slug: string) => `/store/${slug}`,
  storeCheckout: (slug: string) => `/store/${slug}/checkout`,
  invoice: (invoiceCode: string) => `/invoice/${invoiceCode}`,
  trackOrder: "/track-order",
} as const;

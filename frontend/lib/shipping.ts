export type ShippingLine = {
  productId: number;
  quantity: number;
  shippingCost: string | number | null | undefined;
};

export type ShippingStoreConfig = {
  default_shipping_cost: string | number;
  free_shipping_min_subtotal?: string | number | null;
};

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Mirror of backend shipping_service.compute_shipping_amount. */
export function computeShippingAmount(
  subtotal: number,
  store: ShippingStoreConfig,
  lines: ShippingLine[],
): number {
  const productLines = lines.filter((line) => line.shippingCost !== null && line.shippingCost !== undefined && line.shippingCost !== "");
  if (productLines.length > 0) {
    return productLines.reduce(
      (sum, line) => sum + toNumber(line.shippingCost) * line.quantity,
      0,
    );
  }

  const threshold = store.free_shipping_min_subtotal;
  if (threshold !== null && threshold !== undefined && subtotal >= toNumber(threshold)) {
    return 0;
  }
  return toNumber(store.default_shipping_cost);
}

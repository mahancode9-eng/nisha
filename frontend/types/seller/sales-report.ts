export type SalesReportTotals = {
  orders: number;
  revenue: string;
  average_order_value: string;
  manual_orders: number;
  repeat_buyers: number;
};

export type SalesReportTopProduct = {
  product_id: number | null;
  title: string;
  quantity: number;
  revenue: string;
};

export type SalesReport = {
  days: number;
  totals: SalesReportTotals;
  top_products: SalesReportTopProduct[];
};

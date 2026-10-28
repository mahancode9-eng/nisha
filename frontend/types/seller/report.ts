export type BestSellingProduct = {
  product_id: number | null;
  title: string;
  quantity: number;
  revenue: string | number;
};

export type MonthTotals = {
  total_sales: string | number;
  order_count: number;
};

export type SalesReport = {
  month: string;
  month_label: string;
  previous_month: string;
  next_month: string | null;
  total_sales: string | number;
  order_count: number;
  average_order_value: string | number;
  manual_order_count: number;
  manual_sales: string | number;
  best_sellers: BestSellingProduct[];
  previous: MonthTotals;
};

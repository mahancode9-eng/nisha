export type AnalyticsDailyPoint = {
  date: string;
  orders: number;
  revenue: number | string;
  visits: number;
};

export type AnalyticsTotals = {
  orders: number;
  revenue: number | string;
  visits: number;
  conversion_rate: number;
};

export type TopProductItem = {
  product_id: number | null;
  title: string;
  quantity: number;
  revenue: number | string;
};

export type SellerAnalyticsResponse = {
  days: number;
  daily: AnalyticsDailyPoint[];
  totals: AnalyticsTotals;
  top_products: TopProductItem[];
};

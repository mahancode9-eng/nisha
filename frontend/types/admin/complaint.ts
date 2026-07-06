export type ComplaintStatus = "OPEN" | "IN_REVIEW" | "RESOLVED";

export type AdminComplaint = {
  id: number;
  order_id: number;
  invoice_code: string;
  buyer_name: string;
  store_id: number;
  store_name: string;
  store_slug: string;
  reason: string;
  message: string;
  status: ComplaintStatus;
  created_at: string;
  updated_at: string;
};

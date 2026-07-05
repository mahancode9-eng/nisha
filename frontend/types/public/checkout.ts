import type { OrderStatus } from "@/types/order";
import type { PaymentMethodType } from "@/types/seller/payment-method";

export type OrderItemInput = {
  product_id: number;
  quantity: number;
  field_values?: OrderItemFieldValueInput[];
};

export type OrderItemFieldValueInput = {
  field_key: string;
  value?: string | number | boolean | string[] | null;
  file_url?: string | null;
};

export type GuestOrderCreate = {
  buyer_name: string;
  buyer_phone: string;
  buyer_address: string;
  buyer_note?: string | null;
  payment_method_id: number;
  items: OrderItemInput[];
};

export type CheckoutOrderItemSummary = {
  product_id: number;
  product_title: string;
  quantity: number;
  unit_price: string;
  total_price: string;
};

export type CheckoutPaymentInstructions = {
  id: number;
  type: PaymentMethodType;
  display_name: string;
  card_number: string | null;
  wallet_address: string | null;
  external_url: string | null;
  owner_name: string | null;
  instructions: string | null;
};

export type CheckoutResponse = {
  invoice_code: string;
  invoice_edit_password: string;
  order_id: number;
  status: OrderStatus;
  subtotal_amount: string;
  total_amount: string;
  items: CheckoutOrderItemSummary[];
  payment_method: CheckoutPaymentInstructions;
};

import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";
import type { OrderItemFieldValue, OrderLineItem } from "@/types/order-item";

type OrderItemsPanelProps = {
  items: OrderLineItem[];
  subtotalAmount?: string;
  shippingAmount?: string | number;
  totalAmount?: string;
  embedded?: boolean;
  showUnitPrice?: boolean;
  productEditHref?: (productId: number) => string;
};

function itemTitle(item: OrderLineItem): string {
  return item.product_title_snapshot ?? item.product_title ?? "—";
}

function itemVariant(item: OrderLineItem): string | null {
  return item.variant_name_snapshot ?? item.variant_name ?? null;
}

function itemUnitPrice(item: OrderLineItem): string {
  return item.unit_price_snapshot ?? item.unit_price ?? "0";
}

function formatFieldValue(field: OrderItemFieldValue): string {
  if (field.file_url) return field.file_url;
  if (field.value_text) return field.value_text;
  if (field.value_json !== null && field.value_json !== undefined) {
    if (typeof field.value_json === "string") return field.value_json;
    if (typeof field.value_json === "object") return JSON.stringify(field.value_json);
    return String(field.value_json);
  }
  return "—";
}

function FieldValuesList({ fields }: { fields: OrderItemFieldValue[] }) {
  if (fields.length === 0) return null;

  return (
    <div className="mt-2 space-y-1.5 rounded-lg bg-surface-muted/80 p-2.5">
      {fields.map((field) => (
        <div key={field.field_key} className="text-xs">
          <span className="font-medium text-foreground">{field.field_label}: </span>
          {field.file_url ? (
            <a
              href={resolveMediaUrl(field.file_url)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              مشاهده فایل
            </a>
          ) : (
            <span className="text-foreground-muted">{formatFieldValue(field)}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export function OrderItemsPanel({
  items,
  subtotalAmount,
  shippingAmount,
  totalAmount,
  embedded = true,
  showUnitPrice = true,
  productEditHref,
}: OrderItemsPanelProps) {
  return (
    <div>
      <Table embedded={embedded}>
        <TableHead>
          <TableRow>
            <TableHeaderCell>محصول</TableHeaderCell>
            <TableHeaderCell>تعداد</TableHeaderCell>
            {showUnitPrice && <TableHeaderCell>قیمت واحد</TableHeaderCell>}
            <TableHeaderCell>جمع</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item, idx) => {
            const title = itemTitle(item);
            const variant = itemVariant(item);
            const rowKey = item.id ?? `${title}-${idx}`;

            return (
              <TableRow key={rowKey}>
                <TableCell className="whitespace-normal">
                  <div>
                    {item.product_id && productEditHref ? (
                      <Link
                        href={productEditHref(item.product_id)}
                        className="font-medium text-brand hover:underline"
                      >
                        {title}
                      </Link>
                    ) : (
                      <span className="font-medium">{title}</span>
                    )}
                    {variant && (
                      <p className="mt-0.5 text-xs text-foreground-muted">نوع: {variant}</p>
                    )}
                    {item.field_values && item.field_values.length > 0 && (
                      <FieldValuesList fields={item.field_values} />
                    )}
                  </div>
                </TableCell>
                <TableCell>{item.quantity}</TableCell>
                {showUnitPrice && <TableCell>{formatMoney(itemUnitPrice(item))}</TableCell>}
                <TableCell>{formatMoney(item.total_price)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {(subtotalAmount || shippingAmount || totalAmount) && (
        <div className="mt-4 flex flex-col items-end gap-1 text-sm">
          {subtotalAmount && (
            <span className="text-foreground-muted">جمع جزء: {formatMoney(subtotalAmount)}</span>
          )}
          {shippingAmount !== undefined && Number(shippingAmount) > 0 && (
            <span className="text-foreground-muted">هزینه ارسال: {formatMoney(shippingAmount)}</span>
          )}
          {totalAmount && <span className="font-semibold">مجموع: {formatMoney(totalAmount)}</span>}
        </div>
      )}
    </div>
  );
}

from __future__ import annotations

from html import escape

from app.models.order import Order
from app.schemas.customer_portal import CustomerInvoiceDownloadResponse


def build_invoice_download(order: Order) -> CustomerInvoiceDownloadResponse:
    rows = "\n".join(
        f"<tr><td>{escape(item.product_title_snapshot)}</td><td>{item.quantity}</td><td>{escape(str(item.unit_price_snapshot))}</td><td>{escape(str(item.total_price))}</td></tr>"
        for item in order.items
    )
    html = f"""<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice {escape(order.invoice_code)}</title>
  <style>
    body {{ font-family: Arial, sans-serif; color: #111; padding: 32px; }}
    h1 {{ margin: 0 0 8px; }}
    table {{ width: 100%; border-collapse: collapse; margin-top: 16px; }}
    th, td {{ border-bottom: 1px solid #ddd; padding: 8px; text-align: left; }}
    .meta {{ color: #555; font-size: 14px; }}
    .total {{ text-align: right; margin-top: 16px; font-weight: bold; }}
  </style>
</head>
<body>
  <h1>{escape(order.store.name)}</h1>
  <p class="meta">Invoice: {escape(order.invoice_code)}</p>
  <p class="meta">Status: {escape(order.status.value)}</p>
  <p class="meta">Buyer: {escape(order.buyer_name)} | {escape(order.buyer_phone)}</p>
  <p class="meta">{escape(order.buyer_address)}</p>
  <table>
    <thead>
      <tr><th>Item</th><th>Qty</th><th>Unit</th><th>Total</th></tr>
    </thead>
    <tbody>{rows}</tbody>
  </table>
  <p class="total">Subtotal: {escape(str(order.subtotal_amount))} | Total: {escape(str(order.total_amount))}</p>
</body>
</html>"""
    return CustomerInvoiceDownloadResponse(
        filename=f"invoice-{order.invoice_code}.html",
        content_type="text/html; charset=utf-8",
        content=html,
    )

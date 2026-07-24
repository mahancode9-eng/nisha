export async function saveInvoiceBlob(blob: Blob, invoiceCode: string): Promise<void> {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `invoice-${invoiceCode}.html`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

export async function downloadOrderInvoice(
  fetchBlob: () => Promise<Blob>,
  invoiceCode: string,
): Promise<void> {
  const blob = await fetchBlob();
  await saveInvoiceBlob(blob, invoiceCode);
}

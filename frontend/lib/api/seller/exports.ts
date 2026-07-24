import { apiDownload } from "@/lib/api/client";

export function exportProductsCsv() {
  return apiDownload("/api/v1/seller/exports/products.csv");
}

export function exportOrdersCsv() {
  return apiDownload("/api/v1/seller/exports/orders.csv");
}

export async function downloadCsv(fetchBlob: () => Promise<Blob>, filename: string) {
  const blob = await fetchBlob();
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

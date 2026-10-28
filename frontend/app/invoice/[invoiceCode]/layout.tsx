import type { Metadata } from "next";
import { getApiUrl, getSiteUrl } from "@/lib/env";
import { formatMoney } from "@/lib/format";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ invoiceCode: string }>;
};

type InvoicePreview = {
  invoice_code: string;
  status: string;
  store_name: string;
  total_amount: string | number;
  currency_label?: string;
};

async function fetchInvoicePreview(invoiceCode: string): Promise<InvoicePreview | null> {
  try {
    const res = await fetch(
      getApiUrl() +
        "/api/v1/public/orders/" +
        encodeURIComponent(invoiceCode) +
        "/preview",
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return null;
    return (await res.json()) as InvoicePreview;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { invoiceCode } = await params;
  const preview = await fetchInvoicePreview(invoiceCode);
  const storeName = preview?.store_name?.trim() || null;
  const amount =
    preview?.total_amount != null && preview.total_amount !== ""
      ? formatMoney(preview.total_amount)
      : null;
  const title = storeName
    ? `فاکتور ${invoiceCode} · ${storeName}`
    : `فاکتور ${invoiceCode}`;
  const descriptionParts = [
    amount,
    storeName ? `از ${storeName}` : null,
    "مشاهده فاکتور، پرداخت و آپلود رسید در نیشا",
  ].filter(Boolean);
  const description = descriptionParts.join(" · ");
  const canonical = getSiteUrl() + "/invoice/" + encodeURIComponent(invoiceCode);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      locale: "fa_IR",
      siteName: storeName || "نیشا",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    robots: { index: false, follow: false },
  };
}

export default function InvoiceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background print:bg-white">
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 text-sm text-foreground-muted print:hidden">
        <span>نیشا، فاکتور</span>
      </div>
      {children}
    </div>
  );
}

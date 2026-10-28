import type { Metadata } from "next";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ invoiceCode: string }>;
};

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { invoiceCode } = await params;
  const title = `فاکتور ${invoiceCode}`;
  const description = "مشاهده فاکتور، پرداخت و آپلود رسید در نیشا";
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "fa_IR",
      siteName: "نیشا",
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

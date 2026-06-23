import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";

export default function InvoiceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background print:bg-white">
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 text-sm text-foreground-muted print:hidden">
        <span>نیشا - فاکتور</span>
        <ThemeSwitcher variant="button" />
      </div>
      {children}
    </div>
  );
}

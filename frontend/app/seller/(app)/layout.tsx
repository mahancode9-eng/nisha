"use client";

import Link from "next/link";
import { SellerAuthGuard } from "@/components/auth/SellerAuthGuard";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { useAuth } from "@/contexts/AuthContext";
import { paths } from "@/lib/auth/paths";
import { Button } from "@/components/ui/Button";

export default function SellerAppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  const navItems = [
    { href: paths.seller.dashboard, label: "داشبورد", description: "سفارش‌ها، درآمد، و فعالیت‌ها" },
    { href: paths.seller.store, label: "فروشگاه", description: "پروفایل و تنظیمات عمومی" },
    { href: paths.seller.products, label: "محصولات", description: "کاتالوگ و فرم‌های محصول" },
    { href: paths.seller.orders, label: "سفارش‌ها", description: "ارسال و تغییر وضعیت" },
    { href: paths.seller.conversations, label: "گفتگوها", description: "پیام‌های مشتری و مهمان" },
    { href: paths.seller.paymentMethods, label: "پرداخت‌ها", description: "تنظیمات دریافت و پرداخت" },
  ];

  return (
    <SellerAuthGuard>
      <WorkspaceShell
        variant="sidebar"
        brandLabel="Nisha"
        roleLabel="مرکز فروشنده"
        title="مدیریت فروشگاه"
        subtitle="محصولات، سفارش‌ها، گفتگوها، و تنظیمات فروشگاه را از یک فضا مدیریت کنید."
        userName={user?.full_name ?? null}
        userMeta={user?.email ?? user?.store_slug ?? null}
        navItems={navItems}
        onLogout={logout}
        topActions={
          <Link href={paths.home}>
            <Button variant="secondary" size="sm">
              مشاهده فروشگاه
            </Button>
          </Link>
        }
      >
        {children}
      </WorkspaceShell>
    </SellerAuthGuard>
  );
}

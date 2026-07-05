"use client";

import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { AdminAuthGuard } from "@/components/auth/AdminAuthGuard";
import { useAuth } from "@/contexts/AuthContext";
import { paths } from "@/lib/auth/paths";

export default function AdminAppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  const navItems = [
    { href: paths.admin.dashboard, label: "داشبورد", description: "نمای کلی پلتفرم" },
    { href: paths.admin.orders, label: "سفارش‌ها", description: "جستجو و مدیریت سفارش‌ها" },
    { href: paths.admin.stores, label: "فروشگاه‌ها", description: "تایید و تعلیق فروشگاه‌ها" },
    { href: paths.admin.reviews, label: "نظرات", description: "مدیریت نظرات عمومی" },
    { href: paths.admin.chats, label: "گفتگوها", description: "گفتگوهای سراسری سفارش‌ها" },
  ];

  return (
    <AdminAuthGuard>
      <WorkspaceShell
        variant="tabs"
        brandLabel="Nisha"
        roleLabel="پنل مدیریت"
        title="فضای عملیات"
        subtitle="سفارش‌ها را جستجو کنید، فروشگاه‌ها را مدیریت کنید، گفتگوها را بررسی کنید، و پلتفرم را پایش کنید."
        userName={user?.full_name ?? null}
        userMeta={user?.email ?? null}
        navItems={navItems}
        onLogout={logout}
      >
        {children}
      </WorkspaceShell>
    </AdminAuthGuard>
  );
}

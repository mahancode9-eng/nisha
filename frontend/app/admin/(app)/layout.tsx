"use client";

import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { AdminAuthGuard } from "@/components/auth/AdminAuthGuard";
import { useAuth } from "@/contexts/AuthContext";
import { paths } from "@/lib/auth/paths";

export default function AdminAppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  const navItems = [
    { href: paths.admin.dashboard, label: "داشبورد" },
    { href: paths.admin.orders, label: "سفارش‌ها" },
    { href: paths.admin.stores, label: "فروشگاه‌ها" },
    { href: paths.admin.users, label: "کاربران" },
    { href: paths.admin.complaints, label: "شکایت‌ها" },
    { href: paths.admin.reviews, label: "نظرات" },
    { href: paths.admin.chats, label: "گفتگوها" },
    { href: paths.admin.settings, label: "تنظیمات" },
  ];

  return (
    <AdminAuthGuard>
      <WorkspaceShell
        variant="tabs"
        brandLabel="Nisha"
        roleLabel="پنل مدیریت"
        title="فضای عملیات"
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

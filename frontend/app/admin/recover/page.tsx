"use client";

import { GuestOnly } from "@/components/auth/GuestOnly";
import { UserRecoverForm } from "@/components/auth/UserRecoverForm";
import { paths } from "@/lib/auth/paths";

export default function AdminRecoverPage() {
  return (
    <GuestOnly role="ADMIN">
      <UserRecoverForm
        title="بازیابی رمز عبور مدیر"
        loginHref={paths.admin.login}
        afterVerifyHref={paths.admin.dashboard}
      />
    </GuestOnly>
  );
}

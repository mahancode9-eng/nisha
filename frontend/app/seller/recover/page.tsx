"use client";

import { GuestOnly } from "@/components/auth/GuestOnly";
import { UserRecoverForm } from "@/components/auth/UserRecoverForm";
import { paths } from "@/lib/auth/paths";

export default function SellerRecoverPage() {
  return (
    <GuestOnly role="SELLER">
      <UserRecoverForm
        title="بازیابی رمز عبور فروشنده"
        loginHref={paths.seller.login}
        afterVerifyHref={paths.seller.dashboard}
      />
    </GuestOnly>
  );
}

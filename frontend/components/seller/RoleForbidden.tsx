import Link from "next/link";
import { paths } from "@/lib/auth/paths";
import { buttonClassName } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

export function RoleForbidden() {
  return (
    <Card>
      <CardContent className="space-y-3 py-6">
        <h3 className="text-base font-semibold text-foreground">این بخش برای نقش تو باز نیست</h3>
        <p className="text-sm text-foreground-muted">
          مالک فروشگاه دسترسی‌های تو رو مشخص کرده. اگه فکر می‌کنی باید به این بخش دسترسی داشته باشی، ازش بخواه نقشت رو عوض کنه.
        </p>
        <Link href={paths.seller.dashboard} className={buttonClassName({ variant: "secondary" })}>
          برگشت به داشبورد
        </Link>
      </CardContent>
    </Card>
  );
}

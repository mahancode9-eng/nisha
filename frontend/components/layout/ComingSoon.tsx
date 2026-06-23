import { EmptyState } from "@/components/ui/EmptyState";

export function ComingSoon({ title }: { title: string }) {
  return (
    <EmptyState
      title={title}
      description="این بخش در نسخه بعدی فعال می‌شود. به‌زودی دوباره بررسی کنید."
    />
  );
}

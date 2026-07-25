import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm font-medium tracking-wide text-brand">۴۰۴</p>
      <h1 className="text-2xl font-bold text-foreground">صفحه پیدا نشد</h1>
      <p className="text-sm text-muted-foreground">
        آدرسی که باز کردی وجود ندارد یا جابه‌جا شده است.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white"
      >
        بازگشت به صفحه اصلی
      </Link>
    </main>
  );
}

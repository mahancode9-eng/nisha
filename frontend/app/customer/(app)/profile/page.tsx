"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { getProfile, updateProfile } from "@/lib/api/customer/profile";
import type { CustomerProfile } from "@/types/customer/profile";

export default function CustomerProfilePage() {
  const { refreshCustomer } = useCustomerAuth();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [postalCode, setPostalCode] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getProfile();
        if (cancelled) return;
        setProfile(data);
        setFullName(data.full_name);
        setEmail(data.email ?? "");
        setPhone(data.phone ?? "");
        setPostalCode(data.postal_code ?? "");
      } catch {
        if (!cancelled) setError("بارگذاری پروفایل ممکن نشد");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
        const updated = await updateProfile({
        full_name: fullName.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        postal_code: postalCode.trim() || null,
      });
      setProfile(updated);
      await refreshCustomer();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "به‌روزرسانی ناموفق بود");
    } finally {
      setSaving(false);
    }
  }

  if (error && !profile) {
    return <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;
  }

  if (!profile) {
    return <LoadingState message="در حال بارگذاری پروفایل..." />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">پروفایل</h1>
        <p className="mt-1 text-sm text-neutral-600">
          اطلاعات تماس خود را برای پرداخت، بازیابی و به‌روزرسانی سفارش‌ها به‌روز نگه دارید.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 py-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="نام کامل" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            <Input label="ایمیل" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="تلفن" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Input label="کد پستی" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" loading={saving}>
              ذخیره تغییرات
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

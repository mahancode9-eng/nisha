"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api/errors";
import { useToast } from "@/contexts/ToastContext";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ListRow } from "@/components/ui/ListRow";
import { ConfirmModal } from "@/components/seller/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import {
  createAddress,
  deleteAddress,
  listAddresses,
  updateAddress,
} from "@/lib/api/customer/profile";
import type { CustomerAddress } from "@/types/customer/profile";

type FormState = {
  label: string;
  recipient_name: string;
  recipient_phone: string;
  postal_code: string;
  address_line1: string;
  address_line2: string;
  city: string;
  province: string;
  country: string;
  is_default: boolean;
};

const emptyForm: FormState = {
  label: "",
  recipient_name: "",
  recipient_phone: "",
  postal_code: "",
  address_line1: "",
  address_line2: "",
  city: "",
  province: "",
  country: "",
  is_default: false,
};

function toForm(address: CustomerAddress): FormState {
  return {
    label: address.label ?? "",
    recipient_name: address.recipient_name,
    recipient_phone: address.recipient_phone,
    postal_code: address.postal_code ?? "",
    address_line1: address.address_line1,
    address_line2: address.address_line2 ?? "",
    city: address.city ?? "",
    province: address.province ?? "",
    country: address.country ?? "",
    is_default: address.is_default,
  };
}

export default function CustomerAddressesPage() {
  const toast = useToast();
  const [addresses, setAddresses] = useState<CustomerAddress[] | null>(null);
  const [editing, setEditing] = useState<CustomerAddress | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listAddresses();
        if (!cancelled) setAddresses(data);
      } catch {
        if (!cancelled) setError("بارگذاری آدرس‌ها ممکن نشد");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function startCreate() {
    setEditing(null);
    setForm(emptyForm);
  }

  function startEdit(address: CustomerAddress) {
    setEditing(address);
    setForm(toForm(address));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        label: form.label || null,
        recipient_name: form.recipient_name,
        recipient_phone: form.recipient_phone,
        postal_code: form.postal_code || null,
        address_line1: form.address_line1,
        address_line2: form.address_line2 || null,
        city: form.city || null,
        province: form.province || null,
        country: form.country || null,
        is_default: form.is_default,
      };
      if (editing) {
        const updated = await updateAddress(editing.id, payload);
        setAddresses((prev) => (prev ? prev.map((item) => (item.id === updated.id ? updated : item)) : [updated]));
      } else {
        const created = await createAddress(payload);
        setAddresses((prev) => [created, ...(prev ?? [])]);
      }
      startCreate();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ذخیره ناموفق بود");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteAddress(id);
      setAddresses((prev) => prev?.filter((item) => item.id !== id) ?? null);
      setDeleteTarget(null);
      toast.success("آدرس حذف شد");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "حذف ناموفق بود");
      setDeleteTarget(null);
    }
  }

  if (addresses === null) {
    return <LoadingState message="در حال بارگذاری آدرس‌ها..." />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>آدرس‌های ذخیره‌شده</CardTitle>
          <Button variant="ghost" size="sm" onClick={startCreate}>
            جدید
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {addresses.length === 0 ? (
            <EmptyState title="آدرسی ذخیره نشده" description="یک آدرس اضافه کنید تا پرداخت سریع‌تر شود." />
          ) : (
            addresses.map((address) => (
              <ListRow key={address.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-foreground">
                      {address.label ?? "آدرس"} {address.is_default ? "(پیش‌فرض)" : ""}
                    </p>
                    <p className="text-sm text-foreground-muted">{address.recipient_name}</p>
                    <p className="text-sm text-foreground-muted">{address.address_line1}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(address)}>
                      ویرایش
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(address.id)}>
                      حذف
                    </Button>
                  </div>
                </div>
              </ListRow>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{editing ? "ویرایش آدرس" : "افزودن آدرس"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <Input label="برچسب" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
            <Input
              label="نام گیرنده"
              value={form.recipient_name}
              onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}
              required
            />
            <Input
              label="تلفن گیرنده"
              value={form.recipient_phone}
              onChange={(e) => setForm({ ...form, recipient_phone: e.target.value })}
              required
              pattern="09[0-9]{9}"
              placeholder="09123456789"
              title="شماره موبایل باید با 09 شروع شود و 11 رقم باشد"
            />
            <Input
              label="کد پستی"
              value={form.postal_code}
              onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
            />
            <div className="sm:col-span-2">
              <Input
                label="خط آدرس ۱"
                value={form.address_line1}
                onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Input
                label="خط آدرس ۲"
                value={form.address_line2}
                onChange={(e) => setForm({ ...form, address_line2: e.target.value })}
              />
            </div>
            <Input label="شهر" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <Input
              label="استان"
              value={form.province}
              onChange={(e) => setForm({ ...form, province: e.target.value })}
            />
            <Input
              label="کشور"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
            />
            <label htmlFor="address-is-default" className="flex items-center gap-2 text-sm text-foreground sm:col-span-2">
              <input
                id="address-is-default"
                type="checkbox"
                checked={form.is_default}
                onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                className="rounded border-border"
              />
              به‌عنوان پیش‌فرض تنظیم شود
            </label>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2" role="alert">
                {error}
              </p>
            )}
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" loading={saving}>
                {editing ? "به‌روزرسانی" : "ذخیره"}
              </Button>
              {editing && (
                <Button type="button" variant="secondary" onClick={startCreate}>
                  لغو
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
      <ConfirmModal
        open={deleteTarget !== null}
        title="حذف آدرس"
        message="آیا از حذف این آدرس اطمینان دارید؟"
        confirmLabel="حذف"
        onConfirm={() => deleteTarget !== null && handleDelete(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { changePassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { paths } from "@/lib/auth/paths";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function SellerChangePasswordPage() {
  const { user } = useAuth();
  const toast = useToast();
  const hasPassword = user?.has_password !== false;
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.trim().length < 8) {
      setError("رمز جدید باید حداقل ۸ کاراکتر باشه.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("رمز جدید و تکرارش یکی نیستن.");
      return;
    }
    if (hasPassword && !currentPassword) {
      setError("رمز فعلی رو وارد کن.");
      return;
    }

    setLoading(true);
    try {
      const result = await changePassword({
        current_password: hasPassword ? currentPassword : null,
        new_password: newPassword,
      });
      toast.success(result.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "رمز عوض نشد. دوباره امتحان کن.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="رمز عبور"
        description={
          hasPassword
            ? "رمز ورود به پنل فروشنده رو عوض کن."
            : "برای این حساب هنوز رمزی نیست؛ یه رمز جدید بذار تا بتونی با ایمیل هم وارد بشی."
        }
      />

      <Card className="max-w-lg">
        <CardContent className="py-6">
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            {hasPassword ? (
              <Input
                label="رمز فعلی"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            ) : null}
            <Input
              label="رمز جدید"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              hint="حداقل ۸ کاراکتر"
            />
            <Input
              label="تکرار رمز جدید"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            {error ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" loading={loading}>
                {hasPassword ? "ذخیره رمز جدید" : "ثبت رمز"}
              </Button>
              {hasPassword ? (
                <Link href={paths.seller.recover} className="text-sm text-brand hover:underline">
                  رمز رو فراموش کردی؟
                </Link>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

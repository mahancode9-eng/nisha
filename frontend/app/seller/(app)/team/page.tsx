"use client";

import { useState } from "react";
import * as teamApi from "@/lib/api/seller/team";
import * as storeApi from "@/lib/api/seller/store";
import { formatDateTime } from "@/lib/format";
import { ApiError } from "@/lib/api/errors";
import { useToast } from "@/contexts/ToastContext";
import { useSellerEntitlements } from "@/hooks/useSellerEntitlements";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { ConfirmModal } from "@/components/seller/ConfirmModal";
import { UpgradeGate } from "@/components/seller/UpgradeGate";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";

const ROLE_LABELS: Record<string, string> = {
  STAFF: "همکار",
  MANAGER: "مدیر",
  OWNER: "مالک",
};

const ACTION_LABELS: Record<string, string> = {
  "member.invite": "دعوت همکار",
  "member.remove": "حذف همکار",
  "domain.set": "ثبت دامنه",
  "domain.verify": "تایید دامنه",
  "domain.clear": "حذف دامنه",
};

function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

export default function SellerTeamPage() {
  const toast = useToast();
  const { entitlements, isLoading: entitlementsLoading } = useSellerEntitlements();
  const canTeam = Boolean(entitlements.store_team);
  const canDomain = Boolean(entitlements.custom_domain);

  const {
    data: members,
    error: membersError,
    isLoading: membersLoading,
    refetch: refetchMembers,
  } = useSellerFetch(canTeam ? () => teamApi.listMembers() : async () => [], [canTeam]);

  const {
    data: logs,
    isLoading: logsLoading,
    refetch: refetchLogs,
  } = useSellerFetch(canTeam ? () => teamApi.listAuditLogs(30) : async () => [], [canTeam]);

  const {
    data: store,
    isLoading: storeLoading,
    refetch: refetchStore,
  } = useSellerFetch(() => storeApi.getStore(), []);

  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [removeId, setRemoveId] = useState<number | null>(null);
  const [removing, setRemoving] = useState(false);
  const [domain, setDomain] = useState("");
  const [savingDomain, setSavingDomain] = useState(false);
  const [verifyingDomain, setVerifyingDomain] = useState(false);

  const domainValue = store?.custom_domain ?? "";
  const domainInput = domain || domainValue;

  async function handleInvite() {
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error("ایمیل همکارت رو بنویس.");
      return;
    }
    setInviting(true);
    try {
      await teamApi.inviteMember({ email: trimmed, role: "STAFF" });
      toast.success("دعوت فرستاده شد");
      setEmail("");
      await Promise.all([refetchMembers(), refetchLogs()]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "دعوت فرستاده نشد. دوباره امتحان کن.");
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove() {
    if (removeId === null) return;
    setRemoving(true);
    try {
      await teamApi.removeMember(removeId);
      toast.success("عضو حذف شد");
      setRemoveId(null);
      await Promise.all([refetchMembers(), refetchLogs()]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "حذف نشد. دوباره امتحان کن.");
    } finally {
      setRemoving(false);
    }
  }

  async function handleSaveDomain() {
    setSavingDomain(true);
    try {
      const cleaned = domainInput.trim() || null;
      await teamApi.setCustomDomain(cleaned);
      toast.success(cleaned ? "دامنه ذخیره شد" : "دامنه برداشته شد");
      setDomain("");
      await Promise.all([refetchStore(), refetchLogs()]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "دامنه ذخیره نشد. دوباره امتحان کن.");
    } finally {
      setSavingDomain(false);
    }
  }

  async function handleVerifyDomain() {
    setVerifyingDomain(true);
    try {
      await teamApi.verifyCustomDomain();
      toast.success("دامنه تایید شد");
      await Promise.all([refetchStore(), refetchLogs()]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تایید دامنه نشد. دوباره امتحان کن.");
    } finally {
      setVerifyingDomain(false);
    }
  }

  if (entitlementsLoading || membersLoading || storeLoading) {
    return <LoadingState message="داره تنظیمات تیم رو بارگذاری می‌کنه…" />;
  }

  return (
    <div className="page-stack">
      <PageHeader description="همکار اضافه کن و دامنه اختصاصی فروشگاهت رو وصل کن" />

      <Card>
        <CardHeader>
          <CardTitle>اعضای تیم</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!canTeam ? (
            <UpgradeGate
              compact
              description="دعوت همکار از پلن سازمانی فعاله."
            />
          ) : (
            <>
              {membersError ? <ErrorAlert message={membersError} /> : null}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <Input
                    label="ایمیل همکار"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    dir="ltr"
                  />
                </div>
                <Button loading={inviting} onClick={() => void handleInvite()}>
                  دعوت
                </Button>
              </div>
              {!members?.length ? (
                <EmptyState
                  title="هنوز همکار نداری"
                  description="با ایمیل دعوت کن تا بتونه تو پنل کمکت کنه."
                />
              ) : (
                <ul className="space-y-3">
                  {members.map((member) => (
                    <li
                      key={member.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2"
                    >
                      <div>
                        <p className="font-medium" dir="ltr">
                          {member.email}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-foreground-muted">
                          <Badge variant="neutral">{roleLabel(member.role)}</Badge>
                          <span>
                            {member.accepted_at
                              ? `پذیرفته در ${formatDateTime(member.accepted_at)}`
                              : "در انتظار پذیرش"}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={() => setRemoveId(member.id)}
                      >
                        حذف
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>دامنه اختصاصی</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!canDomain ? (
            <UpgradeGate
              compact
              description="دامنه اختصاصی از پلن سازمانی فعاله."
            />
          ) : (
            <>
              <Input
                label="دامنه"
                value={domainInput}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="shop.example.com"
                dir="ltr"
                hint="دامنه رو بدون https وارد کن. بعد از ذخیره، رکوردهای DNS رو بزن و تایید کن."
              />
              {store?.custom_domain && store.custom_domain_txt_name && store.custom_domain_txt_value ? (
                <div className="space-y-2 rounded-xl border border-border bg-surface-muted/40 p-3 text-sm">
                  <p className="font-medium text-foreground">۱) رکورد TXT مالکیت</p>
                  <p className="text-foreground-muted">
                    Host:{" "}
                    <span className="font-mono" dir="ltr">
                      {store.custom_domain_txt_name}
                    </span>
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono break-all" dir="ltr">
                      {store.custom_domain_txt_value}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        void navigator.clipboard.writeText(store.custom_domain_txt_value ?? "").then(
                          () => toast.success("مقدار TXT کپی شد"),
                          () => toast.error("کپی نشد"),
                        );
                      }}
                    >
                      کپی
                    </Button>
                  </div>
                  {store.custom_domain_cname_target ? (
                    <>
                      <p className="mt-2 font-medium text-foreground">۲) CNAME به نیشا</p>
                      <p className="text-foreground-muted">
                        Host:{" "}
                        <span className="font-mono" dir="ltr">
                          {store.custom_domain}
                        </span>{" "}
                        →{" "}
                        <span className="font-mono" dir="ltr">
                          {store.custom_domain_cname_target}
                        </span>
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-foreground-muted">
                      تو محیط لوکال/تست، بدون DNS هم می‌تونی تایید کنی. تو پروداکشن، CNAME هدف از تنظیمات سرور میاد.
                    </p>
                  )}
                </div>
              ) : null}
              {store?.custom_domain_verified_at ? (
                <p className="text-sm text-foreground-muted">
                  تایید شده در {formatDateTime(store.custom_domain_verified_at)}
                </p>
              ) : store?.custom_domain ? (
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  دامنه ذخیره شده، هنوز تایید نشده.
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button loading={savingDomain} onClick={() => void handleSaveDomain()}>
                  ذخیره دامنه
                </Button>
                <Button
                  variant="secondary"
                  loading={verifyingDomain}
                  disabled={!store?.custom_domain || savingDomain}
                  onClick={() => void handleVerifyDomain()}
                >
                  بررسی و تایید DNS
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {canTeam ? (
        <Card>
          <CardHeader>
            <CardTitle>آخرین کارها</CardTitle>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <LoadingState message="داره لاگ‌ها رو می‌خونه…" />
            ) : !logs?.length ? (
              <EmptyState title="هنوز لاگی نیست" description="وقتی کسی کاری کنه، اینجا می‌بینی." />
            ) : (
              <ul className="space-y-3 text-sm">
                {logs.map((log) => (
                  <li key={log.id} className="border-b border-border pb-2 last:border-0">
                    <p className="font-medium text-foreground">{actionLabel(log.action)}</p>
                    <p className="text-foreground-muted">
                      {formatDateTime(log.created_at)}
                      {log.note ? ` · ${log.note}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}

      <ConfirmModal
        open={removeId !== null}
        title="حذف عضو"
        message="این همکار از تیم فروشگاهت حذف بشه؟"
        confirmLabel="حذف"
        confirmVariant="danger"
        loading={removing}
        onConfirm={() => void handleRemove()}
        onClose={() => setRemoveId(null)}
      />
    </div>
  );
}

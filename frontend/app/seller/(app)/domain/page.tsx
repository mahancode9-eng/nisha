"use client";

import { useState } from "react";
import * as domainApi from "@/lib/api/seller/domain";
import { ApiError } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/format";
import { useToast } from "@/contexts/ToastContext";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { PageHeader } from "@/components/layout/PageHeader";
import { ConfirmModal } from "@/components/seller/ConfirmModal";
import { UpgradeGate } from "@/components/seller/UpgradeGate";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";
import type { DomainStatus, SellerDomain } from "@/types/seller/domain";

const STATUS_BADGES: Record<Exclude<DomainStatus, "none">, { label: string; variant: "warning" | "info" | "success" }> = {
  pending: { label: "منتظر رکورد TXT", variant: "warning" },
  verified: { label: "مالکیت تایید شد — منتظر رکورد اشاره", variant: "info" },
  active: { label: "فعال", variant: "success" },
};

function errorText(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button type="button" size="sm" variant="secondary" onClick={() => void copy()}>
      {copied ? "کپی شد" : "کپی"}
    </Button>
  );
}

function StepTitle({ number, children }: { number: string; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
      <span className="grid h-6 w-6 place-items-center rounded-full bg-brand text-xs text-brand-foreground">
        {number}
      </span>
      {children}
    </h3>
  );
}

export default function SellerDomainPage() {
  const toast = useToast();
  const { data, error, isLoading, setData } = useSellerFetch(() => domainApi.getDomain(), []);
  const [hostname, setHostname] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removing, setRemoving] = useState(false);

  const description = "فروشگاهت رو با آدرس خودت، مثل shop.yoursite.com، باز کن";

  async function connect(event: React.FormEvent) {
    event.preventDefault();
    setConnecting(true);
    try {
      setData(await domainApi.connectDomain(hostname.trim()));
      setHostname("");
      toast.success("دامنه ثبت شد. حالا رکوردها رو اضافه کن.");
    } catch (err) {
      toast.error(errorText(err, "دامنه ثبت نشد. دوباره امتحان کن."));
    } finally {
      setConnecting(false);
    }
  }

  async function verify() {
    setVerifying(true);
    try {
      const res = await domainApi.verifyDomain();
      setData(res);
      if (res.status === "active") toast.success("دامنه فعال شد");
    } catch (err) {
      toast.error(errorText(err, "بررسی انجام نشد. دوباره امتحان کن."));
    } finally {
      setVerifying(false);
    }
  }

  async function remove() {
    setRemoving(true);
    try {
      await domainApi.disconnectDomain();
      setData(await domainApi.getDomain());
      setConfirmRemove(false);
      toast.success("دامنه جدا شد");
    } catch (err) {
      toast.error(errorText(err, "دامنه جدا نشد. دوباره امتحان کن."));
    } finally {
      setRemoving(false);
    }
  }

  if (isLoading && !data) {
    return (
      <div className="space-y-4 md:space-y-6">
        <PageHeader description={description} />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="space-y-4 md:space-y-6">
        <PageHeader description={description} />
        <ErrorAlert message={error ?? "اطلاعات دامنه باز نشد. دوباره امتحان کن."} />
      </div>
    );
  }

  const domain: SellerDomain = data;
  const connected = domain.hostname !== null && domain.status !== "none";
  const badge = domain.status === "none" ? null : STATUS_BADGES[domain.status];

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader description={description} />

      {!domain.plan_enabled ? (
        <UpgradeGate
          title="دامنه اختصاصی تو پلن حرفه‌ای فعاله"
          description="با پلن حرفه‌ای، مشتری‌ها فروشگاهت رو با آدرس خودت می‌بینن، بدون هیچ نشونه‌ای از آدرس نیشا. اتصال هم با چند تا رکورد DNS انجام می‌شه."
        />
      ) : null}

      <Card>
        <CardContent className="space-y-3 py-5">
          <StepTitle number="۱">آدرس دامنه</StepTitle>
          <p className="text-sm text-foreground-muted">
            آدرسی که می‌خوای فروشگاهت روش باز بشه رو بنویس. زیردامنه، مثل shop.yoursite.com، ساده‌ترین حالته و
            سایت اصلیت دست نمی‌خوره.
          </p>
          {connected ? (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span dir="ltr" className="font-mono font-medium text-foreground">
                {domain.hostname}
              </span>
              {badge ? <Badge variant={badge.variant}>{badge.label}</Badge> : null}
            </div>
          ) : null}
          <form onSubmit={(event) => void connect(event)} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="w-full sm:max-w-sm">
              <Input
                dir="ltr"
                value={hostname}
                onChange={(event) => setHostname(event.target.value)}
                placeholder="shop.yoursite.com"
                aria-label="آدرس دامنه"
              />
            </div>
            <Button type="submit" loading={connecting} disabled={!domain.plan_enabled || !hostname.trim()}>
              {connected ? "عوض کن" : "وصل کن"}
            </Button>
          </form>
          {connected ? (
            <p className="text-xs text-foreground-muted">
              با عوض کردن دامنه، رکوردهای جدیدی صادر می‌شه و باید دوباره اضافه‌شون کنی.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {connected ? (
        <>
          <Card>
            <CardContent className="space-y-3 py-5">
              <StepTitle number="۲">رکوردهای DNS رو اضافه کن</StepTitle>
              <p className="text-sm text-foreground-muted">
                این رکوردها رو تو پنل DNS دامنه‌ت اضافه کن، همون جایی که دامنه رو خریدی یا مدیریت می‌کنی، مثل
                ایرنیک، Cloudflare یا هر ثبت‌کننده‌ی دیگه. رکورد اول مالکیت دامنه رو ثابت می‌کنه و رکورد دوم
                دامنه رو به نیشا وصل می‌کنه. تغییرات DNS ممکنه تا چند ساعت طول بکشه.
              </p>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>نوع</TableHeaderCell>
                    <TableHeaderCell>نام (Host)</TableHeaderCell>
                    <TableHeaderCell>مقدار (Value)</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {domain.records.map((record) => (
                    <TableRow key={`${record.type}-${record.name}-${record.value}`}>
                      <TableCell dir="ltr" className="text-start font-mono">
                        {record.type}
                      </TableCell>
                      <TableCell dir="ltr" className="text-start">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="break-all font-mono text-xs">{record.name}</span>
                          <CopyButton value={record.name} />
                        </div>
                      </TableCell>
                      <TableCell dir="ltr" className="text-start">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="break-all font-mono text-xs">{record.value}</span>
                          <CopyButton value={record.value} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 py-5">
              <StepTitle number="۳">بررسی دوباره</StepTitle>
              <p className="text-sm text-foreground-muted">
                بعد از اضافه کردن رکوردها، این دکمه رو بزن. اگه هنوز تایید نشد، چند ساعت بعد دوباره امتحان کن.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" variant="secondary" loading={verifying} onClick={() => void verify()}>
                  بررسی دوباره
                </Button>
                {badge ? <Badge variant={badge.variant}>{badge.label}</Badge> : null}
                {domain.last_checked_at ? (
                  <span className="text-xs text-foreground-muted">
                    آخرین بررسی: {formatDateTime(domain.last_checked_at)}
                  </span>
                ) : null}
              </div>
              {domain.last_error && domain.status !== "active" ? (
                <ErrorAlert message={domain.last_error} />
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 py-5">
              <StepTitle number="۴">فروشگاهت زنده‌ست</StepTitle>
              {domain.status === "active" && domain.url ? (
                <>
                  <p className="text-sm text-foreground-muted">
                    فروشگاهت الان رو این آدرس بازه:{" "}
                    <a
                      href={domain.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      dir="ltr"
                      className="font-medium text-brand hover:underline"
                    >
                      {domain.url}
                    </a>
                  </p>
                  <p className="text-sm text-foreground-muted">
                    HTTPS خودکار فعال می‌شه. بار اول که آدرس رو باز می‌کنی ممکنه یه دقیقه طول بکشه تا گواهی امن
                    صادر بشه.
                  </p>
                </>
              ) : (
                <p className="text-sm text-foreground-muted">
                  وقتی مرحله‌ی قبل کامل شد، آدرس فروشگاهت اینجا نشون داده می‌شه.
                </p>
              )}
            </CardContent>
          </Card>

          <div>
            <Button type="button" variant="danger" onClick={() => setConfirmRemove(true)}>
              جدا کردن دامنه
            </Button>
          </div>
        </>
      ) : null}

      <ConfirmModal
        open={confirmRemove}
        title="جدا کردن دامنه"
        message="فروشگاهت دیگه رو این دامنه باز نمی‌شه. رکوردهای DNS رو خودت باید از پنل دامنه پاک کنی. مطمئنی؟"
        confirmLabel="جدا کن"
        loading={removing}
        onConfirm={() => void remove()}
        onClose={() => setConfirmRemove(false)}
      />
    </div>
  );
}

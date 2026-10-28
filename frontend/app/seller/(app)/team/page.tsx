"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import * as teamApi from "@/lib/api/seller/team";
import { ApiError } from "@/lib/api/errors";
import { paths } from "@/lib/auth/paths";
import { formatDateTime, formatNumber } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/seller/areas";
import { useToast } from "@/contexts/ToastContext";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { PageHeader } from "@/components/layout/PageHeader";
import { ConfirmModal } from "@/components/seller/ConfirmModal";
import { UpgradeGate } from "@/components/seller/UpgradeGate";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Input } from "@/components/ui/Input";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";
import type { StoreRole, TeamInvite, TeamMember } from "@/types/seller/team";

const STAFF_ROLES: StoreRole[] = ["order_manager", "product_manager", "owner"];

const ACTION_LABELS: Record<string, string> = {
  "order.confirm_payment": "پرداخت رو تایید کرد",
  "order.reject_payment": "رسید رو رد کرد",
  "order.cancel": "سفارش رو لغو کرد",
  "order.status": "وضعیت سفارش رو عوض کرد",
  "team.invite": "دعوت فرستاد",
  "team.join": "به تیم پیوست",
  "team.role": "نقش رو عوض کرد",
  "team.remove": "از تیم حذف کرد",
};

type Overview = Awaited<ReturnType<typeof teamApi.getTeam>>;
type Loaded = { locked: true } | { locked: false; overview: Overview };

function errorText(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

function InviteForm({
  seatsLeft,
  onInvited,
}: {
  seatsLeft: boolean;
  onInvited: () => void;
}) {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StoreRole>("order_manager");
  const [sending, setSending] = useState(false);
  const [invite, setInvite] = useState<TeamInvite | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    try {
      const res = await teamApi.inviteMember(email.trim(), role);
      setInvite(res);
      setEmail("");
      setCopied(false);
      toast.success("دعوت‌نامه فرستاده شد");
      onInvited();
    } catch (err) {
      toast.error(errorText(err, "دعوت فرستاده نشد. دوباره امتحان کن."));
    } finally {
      setSending(false);
    }
  }

  async function copyLink() {
    if (!invite) return;
    try {
      await navigator.clipboard.writeText(invite.accept_url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 py-5">
        <div>
          <h3 className="text-base font-semibold text-foreground">دعوت همکار جدید</h3>
          <p className="mt-1 text-sm text-foreground-muted">
            ایمیلش رو بنویس و نقشش رو انتخاب کن. یه لینک دعوت براش می‌فرستیم.
          </p>
        </div>
        <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="w-full sm:max-w-xs">
            <Input
              label="ایمیل"
              type="email"
              dir="ltr"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
            />
          </div>
          <div className="w-full sm:w-52">
            <Select label="نقش" value={role} onChange={(event) => setRole(event.target.value as StoreRole)}>
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" loading={sending} disabled={!seatsLeft || !email.trim()}>
            فرستادن دعوت
          </Button>
        </form>
        {!seatsLeft ? (
          <p className="text-sm text-foreground-muted">ظرفیت همکارهای پلنت پر شده.</p>
        ) : null}
        {invite ? (
          <div className="space-y-2 rounded-xl border border-brand/25 bg-brand/5 px-3.5 py-3 text-sm">
            <p className="text-foreground">اگه ایمیل نرسید، این لینک رو براش بفرست:</p>
            <div className="flex flex-wrap items-center gap-2">
              <span dir="ltr" className="min-w-0 break-all font-mono text-xs text-foreground-muted">
                {invite.accept_url}
              </span>
              <Button type="button" size="sm" variant="secondary" onClick={() => void copyLink()}>
                {copied ? "کپی شد" : "کپی لینک"}
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function MembersSection({ overview, refetch }: { overview: Overview; refetch: () => Promise<unknown> }) {
  const toast = useToast();
  const [removing, setRemoving] = useState<TeamMember | null>(null);
  const [busy, setBusy] = useState(false);
  const [roleBusyId, setRoleBusyId] = useState<number | null>(null);

  const staffCount = overview.members.filter((m) => !m.is_store_owner).length;
  const seatsLeft = overview.seats === null || staffCount < overview.seats;

  async function changeRole(member: TeamMember, role: StoreRole) {
    if (member.id === null) return;
    setRoleBusyId(member.id);
    try {
      await teamApi.changeMemberRole(member.id, role);
      toast.success("نقش عوض شد");
      await refetch();
    } catch (err) {
      toast.error(errorText(err, "نقش عوض نشد. دوباره امتحان کن."));
    } finally {
      setRoleBusyId(null);
    }
  }

  async function confirmRemove() {
    if (!removing || removing.id === null) return;
    setBusy(true);
    try {
      await teamApi.removeMember(removing.id);
      toast.success("از تیم حذف شد");
      setRemoving(null);
      await refetch();
    } catch (err) {
      toast.error(errorText(err, "حذف نشد. دوباره امتحان کن."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground-muted">
        ظرفیت همکارها:{" "}
        <span className="font-medium text-foreground">
          {formatNumber(staffCount)} از {overview.seats === null ? "نامحدود" : formatNumber(overview.seats)}
        </span>
      </p>

      <InviteForm seatsLeft={seatsLeft} onInvited={() => void refetch()} />

      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>همکار</TableHeaderCell>
            <TableHeaderCell>نقش</TableHeaderCell>
            <TableHeaderCell>وضعیت</TableHeaderCell>
            <TableHeaderCell>
              <span className="sr-only">عملیات</span>
            </TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {overview.members.map((member) => (
            <TableRow key={member.id ?? "owner"}>
              <TableCell>
                <p className="font-medium text-foreground">{member.full_name ?? member.email}</p>
                {member.full_name ? (
                  <p dir="ltr" className="text-start text-xs text-foreground-muted">
                    {member.email}
                  </p>
                ) : null}
              </TableCell>
              <TableCell>
                {member.is_store_owner || member.id === null ? (
                  <Badge variant="info">{ROLE_LABELS.owner}</Badge>
                ) : (
                  <Select
                    aria-label="نقش"
                    value={member.role}
                    disabled={roleBusyId === member.id}
                    onChange={(event) => void changeRole(member, event.target.value as StoreRole)}
                  >
                    {STAFF_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </Select>
                )}
              </TableCell>
              <TableCell>
                {member.status === "PENDING" ? (
                  <div className="space-y-1">
                    <Badge variant="warning">منتظر قبول دعوت</Badge>
                    {member.invite_expires_at ? (
                      <p className="text-xs text-foreground-muted">
                        اعتبار دعوت تا {formatDateTime(member.invite_expires_at)}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <Badge variant="success">فعال</Badge>
                )}
              </TableCell>
              <TableCell>
                {member.is_store_owner || member.id === null ? null : (
                  <Button type="button" size="sm" variant="ghost" onClick={() => setRemoving(member)}>
                    حذف
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ConfirmModal
        open={removing !== null}
        title="حذف از تیم"
        message={`«${removing?.full_name ?? removing?.email ?? ""}» دیگه به فروشگاهت دسترسی نداره. مطمئنی؟`}
        confirmLabel="حذف"
        loading={busy}
        onConfirm={() => void confirmRemove()}
        onClose={() => setRemoving(null)}
      />
    </div>
  );
}

function AuditSection() {
  const [page, setPage] = useState(1);
  const fetchAudit = useCallback(() => teamApi.listAudit(page), [page]);
  const { data, error, isLoading } = useSellerFetch(fetchAudit, [page]);
  const items = data?.items ?? [];

  if (error) return <ErrorAlert message={error} />;
  if (isLoading) return <TableSkeleton rows={6} columns={4} />;
  if (items.length === 0) {
    return (
      <EmptyState
        title="هنوز کاری ثبت نشده"
        description="کارهای تیم، مثل تایید پرداخت یا لغو سفارش، اینجا ثبت می‌شه."
      />
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>زمان</TableHeaderCell>
            <TableHeaderCell>کی</TableHeaderCell>
            <TableHeaderCell>چیکار کرد</TableHeaderCell>
            <TableHeaderCell>جزئیات</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>{formatDateTime(entry.created_at)}</TableCell>
              <TableCell>
                <span className="font-medium text-foreground">{entry.actor_name}</span>{" "}
                <span className="text-xs text-foreground-muted">
                  ({ROLE_LABELS[entry.actor_role as StoreRole] ?? entry.actor_role})
                </span>
              </TableCell>
              <TableCell>
                {ACTION_LABELS[entry.action] ?? entry.action}
                {entry.order_id !== null ? (
                  <>
                    {" "}
                    <Link
                      href={paths.seller.orderDetail(entry.order_id)}
                      className="font-medium text-brand hover:underline"
                    >
                      {entry.order_invoice ?? `#${formatNumber(entry.order_id)}`}
                    </Link>
                  </>
                ) : entry.order_invoice ? (
                  <> {entry.order_invoice}</>
                ) : null}
              </TableCell>
              <TableCell>{entry.details ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {data ? (
        <PaginationControls
          page={page}
          totalPages={data.total_pages}
          total={data.total}
          onPageChange={setPage}
        />
      ) : null}
    </div>
  );
}

export default function SellerTeamPage() {
  const [tab, setTab] = useState("members");

  const fetchTeam = useCallback(async (): Promise<Loaded> => {
    try {
      const overview = await teamApi.getTeam();
      return overview.enabled ? { locked: false, overview } : { locked: true };
    } catch (err) {
      if (err instanceof ApiError && err.upgradeRequired) return { locked: true };
      throw err;
    }
  }, []);
  const { data: result, error, isLoading, refetch } = useSellerFetch(fetchTeam, []);

  const description = "همکارهات رو دعوت کن تا سفارش‌ها یا محصولات رو با هم مدیریت کنید";

  if (result?.locked) {
    return (
      <div className="space-y-4 md:space-y-6">
        <PageHeader description={description} />
        <UpgradeGate
          title="حساب همکار تو پلن حرفه‌ای فعاله"
          description="با پلن حرفه‌ای، همکارهات با ایمیل خودشون وارد پنل می‌شن. مدیر سفارش‌ها فقط سفارش‌ها و گفتگوها رو می‌بینه، مدیر محصولات فقط محصولات رو، و همه‌ی کارها تو گزارش کارها ثبت می‌شه."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader description={description} />
      {error ? <ErrorAlert message={error} /> : null}
      {isLoading && !result ? (
        <TableSkeleton rows={4} columns={4} />
      ) : result && !result.locked ? (
        <Tabs
          items={[
            { key: "members", label: "اعضای تیم" },
            { key: "audit", label: "گزارش کارها" },
          ]}
          activeKey={tab}
          onChange={setTab}
        >
          {tab === "members" ? (
            <MembersSection overview={result.overview} refetch={refetch} />
          ) : (
            <AuditSection />
          )}
        </Tabs>
      ) : null}
    </div>
  );
}

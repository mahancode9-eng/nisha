"use client";

import { useCallback, useState } from "react";
import * as usersApi from "@/lib/api/admin/users";
import { ApiError } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/format";
import { useToast } from "@/contexts/ToastContext";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Input } from "@/components/ui/Input";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { Select } from "@/components/ui/Select";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { Tabs } from "@/components/ui/Tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";
import type {
  AdminCustomerListItem,
  AdminUserListItem,
} from "@/types/admin/user";
import type { UserRole } from "@/types/auth";

type TabKey = "platform" | "customers";

export default function AdminUsersPage() {
  const toast = useToast();
  const [tab, setTab] = useState<TabKey>("platform");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [draftSearch, setDraftSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [editUser, setEditUser] = useState<AdminUserListItem | null>(null);
  const [editCustomer, setEditCustomer] = useState<AdminCustomerListItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("SELLER");
  const [editActive, setEditActive] = useState(true);
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const fetchPlatform = useCallback(
    () =>
      usersApi.listUsers({
        page,
        page_size: 20,
        search: search || undefined,
        role: roleFilter || undefined,
      }),
    [page, roleFilter, search],
  );

  const fetchCustomers = useCallback(
    () =>
      usersApi.listCustomers({
        page,
        page_size: 20,
        search: search || undefined,
      }),
    [page, search],
  );

  const platform = useSellerFetch(fetchPlatform, [page, roleFilter, search, tab]);
  const customers = useSellerFetch(fetchCustomers, [page, search, tab]);

  const active = tab === "platform" ? platform : customers;

  function openUserEditor(user: AdminUserListItem) {
    setEditUser(user);
    setEditCustomer(null);
    setEditName(user.full_name);
    setEditRole(user.role);
    setEditActive(user.is_active);
    setNewPassword("");
  }

  function openCustomerEditor(customer: AdminCustomerListItem) {
    setEditCustomer(customer);
    setEditUser(null);
    setEditName(customer.full_name);
    setEditEmail(customer.email ?? "");
    setEditPhone(customer.phone ?? "");
    setNewPassword("");
  }

  function closeEditor() {
    setEditUser(null);
    setEditCustomer(null);
    setNewPassword("");
  }

  async function saveUser() {
    if (!editUser) return;
    setBusyId(editUser.id);
    try {
      await usersApi.updateUser(editUser.id, {
        full_name: editName.trim(),
        role: editRole,
        is_active: editActive,
      });
      if (newPassword.trim()) {
        await usersApi.setUserPassword(editUser.id, { password: newPassword.trim() });
      }
      toast.success("کاربر به‌روزرسانی شد");
      closeEditor();
      await platform.refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "به‌روزرسانی ناموفق بود");
    } finally {
      setBusyId(null);
    }
  }

  async function saveCustomer() {
    if (!editCustomer) return;
    setBusyId(editCustomer.id);
    try {
      await usersApi.updateCustomer(editCustomer.id, {
        full_name: editName.trim(),
        email: editEmail.trim() || null,
        phone: editPhone.trim() || null,
      });
      if (newPassword.trim()) {
        await usersApi.setCustomerPassword(editCustomer.id, { password: newPassword.trim() });
      }
      toast.success("مشتری به‌روزرسانی شد");
      closeEditor();
      await customers.refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "به‌روزرسانی ناموفق بود");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="page-stack">
      <PageHeader description="مدیریت حساب‌های ادمین، فروشنده و مشتری" />

      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(draftSearch.trim());
        }}
      >
        <Input
          label="جستجو"
          value={draftSearch}
          onChange={(e) => setDraftSearch(e.target.value)}
          placeholder="نام، ایمیل یا تلفن"
        />
        {tab === "platform" && (
          <Select
            label="نقش"
            value={roleFilter}
            onChange={(e) => {
              setPage(1);
              setRoleFilter(e.target.value as UserRole | "");
            }}
          >
            <option value="">همه</option>
            <option value="ADMIN">ادمین</option>
            <option value="SELLER">فروشنده</option>
          </Select>
        )}
        <Button type="submit">اعمال</Button>
      </form>

      <Tabs
        items={[
          { key: "platform", label: "فروشندگان و ادمین‌ها" },
          { key: "customers", label: "مشتریان" },
        ]}
        activeKey={tab}
        onChange={(key) => {
          setTab(key as TabKey);
          setPage(1);
        }}
      >
        {active.isLoading && <TableSkeleton rows={6} columns={6} />}
        <ErrorAlert message={!active.isLoading && active.error ? active.error : ""} />

        {!active.isLoading && tab === "platform" && platform.data && platform.data.total === 0 && (
          <EmptyState title="کاربری پیدا نشد" />
        )}
        {!active.isLoading && tab === "customers" && customers.data && customers.data.total === 0 && (
          <EmptyState title="مشتری پیدا نشد" />
        )}

        {!active.isLoading && tab === "platform" && platform.data && platform.data.items.length > 0 && (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>نام</TableHeaderCell>
                  <TableHeaderCell>ایمیل</TableHeaderCell>
                  <TableHeaderCell>نقش</TableHeaderCell>
                  <TableHeaderCell>وضعیت</TableHeaderCell>
                  <TableHeaderCell>فروشگاه</TableHeaderCell>
                  <TableHeaderCell>عملیات</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {platform.data.items.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "success" : "warning"}>
                        {user.is_active ? "فعال" : "غیرفعال"}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.store_slug ?? "—"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => openUserEditor(user)}>
                        ویرایش
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls
              page={platform.data.page}
              totalPages={platform.data.total_pages}
              total={platform.data.total}
              onPageChange={setPage}
            />
          </>
        )}

        {!active.isLoading && tab === "customers" && customers.data && customers.data.items.length > 0 && (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>نام</TableHeaderCell>
                  <TableHeaderCell>ایمیل</TableHeaderCell>
                  <TableHeaderCell>تلفن</TableHeaderCell>
                  <TableHeaderCell>سفارش‌ها</TableHeaderCell>
                  <TableHeaderCell>ثبت</TableHeaderCell>
                  <TableHeaderCell>عملیات</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customers.data.items.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>{customer.full_name}</TableCell>
                    <TableCell>{customer.email ?? "—"}</TableCell>
                    <TableCell>{customer.phone ?? "—"}</TableCell>
                    <TableCell>{customer.order_count}</TableCell>
                    <TableCell>{formatDateTime(customer.created_at)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => openCustomerEditor(customer)}>
                        ویرایش
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls
              page={customers.data.page}
              totalPages={customers.data.total_pages}
              total={customers.data.total}
              onPageChange={setPage}
            />
          </>
        )}
      </Tabs>

      {(editUser || editCustomer) && (
        <Card>
          <CardHeader>
            <CardTitle>{editUser ? "ویرایش کاربر پلتفرم" : "ویرایش مشتری"}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Input label="نام" value={editName} onChange={(e) => setEditName(e.target.value)} />
            {editUser && (
              <>
                <Select label="نقش" value={editRole} onChange={(e) => setEditRole(e.target.value as UserRole)}>
                  <option value="ADMIN">ADMIN</option>
                  <option value="SELLER">SELLER</option>
                </Select>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} />
                  حساب فعال است
                </label>
              </>
            )}
            {editCustomer && (
              <>
                <Input label="ایمیل" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                <Input label="تلفن" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
              </>
            )}
            <Input
              label="رمز عبور جدید (اختیاری)"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="md:col-span-2"
            />
            <div className="flex gap-2 md:col-span-2">
              <Button
                loading={busyId !== null}
                onClick={() => void (editUser ? saveUser() : saveCustomer())}
              >
                ذخیره
              </Button>
              <Button variant="ghost" onClick={closeEditor}>
                انصراف
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

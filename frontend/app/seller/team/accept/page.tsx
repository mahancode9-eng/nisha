"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthPageFrame } from "@/components/auth/AuthPageFrame";
import { Button, buttonClassName } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api/errors";
import * as teamApi from "@/lib/api/seller/team";
import { setActiveStoreId } from "@/lib/auth/active-store";
import { paths } from "@/lib/auth/paths";

type Problem = { title: string; message: string; relogin?: boolean };

function problemFor(err: unknown): Problem {
  if (err instanceof ApiError) {
    if (err.code === "INVITE_EMAIL_MISMATCH") {
      return { title: "این دعوت برای ایمیل دیگه‌ایه", message: err.message, relogin: true };
    }
    if (err.status === 410) {
      return {
        title: "دعوت منقضی شده",
        message: "اعتبار این لینک تموم شده. از مالک فروشگاه بخواه دوباره دعوتت کنه.",
      };
    }
    if (err.status === 404) {
      return {
        title: "این دعوت معتبر نیست",
        message: "لینک رو درست کپی نکردی یا دعوت لغو شده. از مالک فروشگاه یه لینک جدید بگیر.",
      };
    }
    return { title: "دعوت قبول نشد", message: err.message };
  }
  return { title: "دعوت قبول نشد", message: "یه مشکلی پیش اومد. دوباره امتحان کن." };
}

function AcceptInvite() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const token = useSearchParams().get("token");
  const startedRef = useRef(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [joinedName, setJoinedName] = useState<string | null>(null);

  const isSeller = user?.role === "SELLER";
  const here = token ? `${paths.seller.teamAccept}?token=${encodeURIComponent(token)}` : paths.seller.teamAccept;
  const loginHref = `${paths.seller.login}?next=${encodeURIComponent(here)}`;

  useEffect(() => {
    if (isLoading || !token) return;
    if (!isSeller) {
      router.replace(loginHref);
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;
    teamApi
      .acceptInvite(token)
      .then((store) => {
        setActiveStoreId(store.store_id);
        setJoinedName(store.name);
        // A full load so the panel starts on the new store.
        window.location.assign(paths.seller.dashboard);
      })
      .catch((err) => setProblem(problemFor(err)));
  }, [isLoading, isSeller, token, router, loginHref]);

  if (!token) {
    return (
      <AuthPageFrame>
        <div className="space-y-3 text-center">
          <h1 className="text-lg font-semibold text-foreground">لینک دعوت ناقصه</h1>
          <p className="text-sm text-foreground-muted">لینکی که از مالک فروشگاه گرفتی رو کامل باز کن.</p>
        </div>
      </AuthPageFrame>
    );
  }

  if (problem) {
    return (
      <AuthPageFrame>
        <div className="space-y-4 text-center">
          <h1 className="text-lg font-semibold text-foreground">{problem.title}</h1>
          <p className="text-sm text-foreground-muted">{problem.message}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {problem.relogin ? (
              <Button
                type="button"
                onClick={() => {
                  logout();
                  router.replace(loginHref);
                }}
              >
                خروج و ورود با ایمیل دیگه
              </Button>
            ) : null}
            <Link href={paths.seller.dashboard} className={buttonClassName({ variant: "secondary" })}>
              رفتن به پنل
            </Link>
          </div>
        </div>
      </AuthPageFrame>
    );
  }

  return (
    <LoadingState message={joinedName ? `به «${joinedName}» پیوستی! داریم می‌ریم پنل…` : "داریم دعوت رو قبول می‌کنیم…"} />
  );
}

export default function AcceptTeamInvitePage() {
  return (
    <Suspense>
      <AcceptInvite />
    </Suspense>
  );
}

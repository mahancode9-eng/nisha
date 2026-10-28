import { NextResponse } from "next/server";
import { getApiUrl, getSiteUrl } from "@/lib/env";

type RouteProps = {
  params: Promise<{ code: string }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  const { code } = await params;
  try {
    const res = await fetch(`${getApiUrl()}/l/${encodeURIComponent(code)}`, {
      redirect: "manual",
      cache: "no-store",
    });
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      const target = location.startsWith("http")
        ? location
        : `${getSiteUrl()}${location.startsWith("/") ? location : `/${location}`}`;
      return NextResponse.redirect(target, 302);
    }
  } catch {
    /* fall through */
  }
  return NextResponse.redirect(getSiteUrl(), 302);
}

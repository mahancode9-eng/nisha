import { getApiUrl } from "@/lib/env";
import {
  clearToken,
  getRefreshToken,
  getToken,
  setRefreshToken,
  setToken,
} from "@/lib/auth/token";
import { getCustomerToken } from "@/lib/auth/customer-token";
import { ApiError } from "@/lib/api/errors";
import { getActiveStoreId } from "@/lib/auth/active-store";

/** Fired when the API says the seller's role can't use an area (see the seller layout). */
export const ROLE_FORBIDDEN_EVENT = "nisha:role-forbidden";

function notifyIfRoleForbidden(err: ApiError): ApiError {
  if (err.status === 403 && err.code === "ROLE_FORBIDDEN" && typeof window !== "undefined") {
    window.dispatchEvent(new Event(ROLE_FORBIDDEN_EVENT));
  }
  return err;
}

/** Seller requests act on the store the seller picked; customer requests never carry it. */
function setStoreHeader(headers: Headers, token: string | null): void {
  if (!token || token !== getToken()) return;
  const storeId = getActiveStoreId();
  if (storeId) headers.set("X-Store-Id", String(storeId));
}

export type ApiRequestOptions = RequestInit & {
  auth?: boolean;
  json?: unknown;
  /** Skip one-shot refresh retry (used by the refresh call itself). */
  _skipRefresh?: boolean;
  /** Prefer customer JWT when both seller and customer sessions exist. */
  preferCustomerAuth?: boolean;
};

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefreshSellerToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/v1/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (!res.ok) {
          clearToken();
          return false;
        }
        const data = (await res.json()) as {
          access_token?: string | null;
          refresh_token?: string | null;
        };
        if (!data.access_token) {
          clearToken();
          return false;
        }
        setToken(data.access_token);
        if (data.refresh_token) {
          setRefreshToken(data.refresh_token);
        }
        return true;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { auth = true, json, headers: initHeaders, _skipRefresh, preferCustomerAuth, ...init } =
    options;

  const headers = new Headers(initHeaders);

  if (json !== undefined && !(json instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = preferCustomerAuth
      ? (getCustomerToken() ?? getToken())
      : (getToken() ?? getCustomerToken());
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
      setStoreHeader(headers, token);
    }
  }

  let res: Response;
  try {
    res = await fetch(`${getApiUrl()}${path}`, {
      ...init,
      headers,
      body:
        json !== undefined
          ? json instanceof FormData
            ? json
            : JSON.stringify(json)
          : init.body,
    });
  } catch {
    throw ApiError.network();
  }

  if (
    res.status === 401 &&
    auth &&
    !_skipRefresh &&
    getToken() &&
    getRefreshToken() &&
    !path.includes("/api/v1/auth/refresh")
  ) {
    const refreshed = await tryRefreshSellerToken();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, _skipRefresh: true });
    }
  }

  if (res.status === 204) {
    return undefined as T;
  }

  if (!res.ok) {
    throw notifyIfRoleForbidden(await ApiError.fromResponse(res));
  }

  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return res.json() as Promise<T>;
  }

  return undefined as T;
}

export function apiGet<T>(path: string, options?: ApiRequestOptions): Promise<T> {
  return apiRequest<T>(path, { ...options, method: "GET" });
}

export function apiPost<T>(
  path: string,
  json?: unknown,
  options?: ApiRequestOptions,
): Promise<T> {
  return apiRequest<T>(path, { ...options, method: "POST", json });
}

export function apiPut<T>(
  path: string,
  json?: unknown,
  options?: ApiRequestOptions,
): Promise<T> {
  return apiRequest<T>(path, { ...options, method: "PUT", json });
}

export function apiPatch<T>(
  path: string,
  json?: unknown,
  options?: ApiRequestOptions,
): Promise<T> {
  return apiRequest<T>(path, { ...options, method: "PATCH", json });
}

export function apiDelete<T>(path: string, options?: ApiRequestOptions): Promise<T> {
  return apiRequest<T>(path, { ...options, method: "DELETE" });
}

export async function apiDownload(path: string, options?: ApiRequestOptions): Promise<Blob> {
  const headers = new Headers(options?.headers);
  if (options?.auth !== false) {
    const token = getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
      setStoreHeader(headers, token);
    }
  }
  const res = await fetch(`${getApiUrl()}${path}`, {
    ...options,
    method: "GET",
    headers,
  });
  if (!res.ok) {
    throw notifyIfRoleForbidden(await ApiError.fromResponse(res));
  }
  return res.blob();
}

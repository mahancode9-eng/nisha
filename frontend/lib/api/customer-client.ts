import { getApiUrl } from "@/lib/env";
import { getCustomerToken } from "@/lib/auth/customer-token";
import { ApiError } from "@/lib/api/errors";
import type { ApiRequestOptions } from "@/lib/api/client";

export async function customerApiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { auth = true, json, headers: initHeaders, ...init } = options;

  const headers = new Headers(initHeaders);

  if (json !== undefined && !(json instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getCustomerToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
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

  if (res.status === 204) {
    return undefined as T;
  }

  if (!res.ok) {
    throw await ApiError.fromResponse(res);
  }

  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return res.json() as Promise<T>;
  }

  return undefined as T;
}

export function customerApiGet<T>(path: string, options?: ApiRequestOptions): Promise<T> {
  return customerApiRequest<T>(path, { ...options, method: "GET" });
}

export function customerApiPost<T>(
  path: string,
  json?: unknown,
  options?: ApiRequestOptions,
): Promise<T> {
  return customerApiRequest<T>(path, { ...options, method: "POST", json });
}

export function customerApiPatch<T>(
  path: string,
  json?: unknown,
  options?: ApiRequestOptions,
): Promise<T> {
  return customerApiRequest<T>(path, { ...options, method: "PATCH", json });
}

export function customerApiDelete<T>(path: string, options?: ApiRequestOptions): Promise<T> {
  return customerApiRequest<T>(path, { ...options, method: "DELETE" });
}

export async function customerApiDownload(path: string): Promise<Blob> {
  const headers = new Headers();
  const token = getCustomerToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(`${getApiUrl()}${path}`, {
    method: "GET",
    headers,
  });
  if (!res.ok) {
    throw await ApiError.fromResponse(res);
  }
  return res.blob();
}

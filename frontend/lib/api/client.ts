import { getApiUrl } from "@/lib/env";
import { getToken } from "@/lib/auth/token";
import { ApiError } from "@/lib/api/errors";

export type ApiRequestOptions = RequestInit & {
  auth?: boolean;
  json?: unknown;
};

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { auth = true, json, headers: initHeaders, ...init } = options;

  const headers = new Headers(initHeaders);

  if (json !== undefined && !(json instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getToken();
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

function parseDetail(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object" && !Array.isArray(detail) && "message" in detail) {
    const msg = (detail as Record<string, unknown>).message;
    if (msg != null) return String(msg);
  }
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    if (typeof first === "object" && first !== null && "msg" in first) {
      const msg = (first as Record<string, unknown>).msg;
      return msg != null ? String(msg) : "Request failed";
    }
  }
  return "Request failed";
}

export type ApiErrorBody = {
  detail?: unknown;
  code?: string;
  meta?: {
    entitlement?: string;
    upgrade_required?: boolean;
    [key: string]: unknown;
  };
};

export class ApiError extends Error {
  readonly status: number;
  readonly detail?: unknown;
  readonly code?: string;
  readonly meta?: ApiErrorBody["meta"];

  constructor(
    status: number,
    message: string,
    detail?: unknown,
    code?: string,
    meta?: ApiErrorBody["meta"],
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
    this.code = code;
    this.meta = meta;
  }

  get upgradeRequired(): boolean {
    return Boolean(this.meta?.upgrade_required) || this.code === "ENTITLEMENT_REQUIRED";
  }

  static async fromResponse(res: Response): Promise<ApiError> {
    let body: ApiErrorBody = {};
    try {
      body = (await res.json()) as ApiErrorBody;
    } catch {
      // ignore non-json
    }
    const nested =
      body.detail && typeof body.detail === "object" && !Array.isArray(body.detail)
        ? (body.detail as ApiErrorBody & { message?: string })
        : null;
    const code = body.code ?? nested?.code;
    const meta = body.meta ?? nested?.meta;
    const message = body.detail
      ? parseDetail(body.detail)
      : res.statusText || "Request failed";
    return new ApiError(res.status, message, body.detail, code, meta);
  }

  static network(message = "Unable to reach the server. Check your connection."): ApiError {
    return new ApiError(0, message);
  }
}

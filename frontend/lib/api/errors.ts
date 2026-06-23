function parseDetail(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    if (typeof first === "object" && first !== null && "msg" in first) {
      const msg = (first as Record<string, unknown>).msg;
      return msg != null ? String(msg) : "Request failed";
    }
  }
  return "Request failed";
}

export class ApiError extends Error {
  readonly status: number;
  readonly detail?: unknown;

  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }

  static async fromResponse(res: Response): Promise<ApiError> {
    let body: { detail?: unknown } = {};
    try {
      body = (await res.json()) as { detail?: unknown };
    } catch {
      // ignore non-json
    }
    const message = body.detail
      ? parseDetail(body.detail)
      : res.statusText || "Request failed";
    return new ApiError(res.status, message, body.detail);
  }

  static network(message = "Unable to reach the server. Check your connection."): ApiError {
    return new ApiError(0, message);
  }
}

import type { z } from "zod";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Fetches a read endpoint and validates the JSON against its DTO schema. */
export async function fetchJson<S extends z.ZodType>(
  url: string,
  schema: S,
  init?: RequestInit,
): Promise<z.infer<S>> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  const res = await fetch(url, { ...init, credentials: "same-origin", headers });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { error?: unknown };
      if (typeof body.error === "string") message = body.error;
    } catch {
      /* non-JSON error */
    }
    if (res.status === 401 && typeof window !== "undefined") {
      window.location.assign(`/sign-in?next=${encodeURIComponent(window.location.pathname)}`);
    }
    throw new ApiError(message, res.status);
  }
  return schema.parse(await res.json());
}

type SafeResultLike = {
  data?: unknown;
  serverError?: unknown;
  validationErrors?: unknown;
};

/** Converts a next-safe-action result into a value or a thrown Error (for TanStack Query). */
export async function unwrap<R extends SafeResultLike>(
  promise: Promise<R | undefined>,
): Promise<NonNullable<R["data"]>> {
  const result = await promise;
  if (!result) throw new Error("No response from server");
  if (typeof result.serverError === "string") throw new Error(result.serverError);
  if (result.validationErrors) throw new Error("Invalid input");
  if (result.data === undefined || result.data === null) throw new Error("Empty response");
  return result.data;
}

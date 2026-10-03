import { describe, expect, it } from "vitest";

import { formatAuthError } from "@/lib/utils/auth-error";

describe("formatAuthError", () => {
  it("maps access_denied to cancellation message", () => {
    expect(formatAuthError("access_denied")).toBe("GitHub sign-in was cancelled.");
  });

  it("maps other error codes to generic message", () => {
    expect(formatAuthError("OAuthCallbackError")).toBe(
      "Could not sign in with GitHub. Please try again.",
    );
  });

  it("returns null for empty or non-string errors", () => {
    expect(formatAuthError(undefined)).toBeNull();
    expect(formatAuthError("")).toBeNull();
    expect(formatAuthError("   ")).toBeNull();
    expect(formatAuthError(123)).toBeNull();
  });
});

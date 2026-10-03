// ponytail: maps only access_denied specifically; upgrade to full error dictionary when adding providers.
export function formatAuthError(error: unknown): string | null {
  if (typeof error !== "string" || !error.trim()) return null;
  if (error === "access_denied") return "GitHub sign-in was cancelled.";
  return "Could not sign in with GitHub. Please try again.";
}

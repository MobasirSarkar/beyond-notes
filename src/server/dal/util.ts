import "server-only";

import { asc, sql, type AnyColumn, type SQL } from "drizzle-orm";

export const iso = (d: Date): string => d.toISOString();
export const isoOrNull = (d: Date | null): string | null => (d ? d.toISOString() : null);
export const dateOrNull = (s: string | null | undefined): Date | null => (s ? new Date(s) : null);

/** Fractional-index keys must be compared byte-wise, independent of DB locale. */
export const byPosition = (col: AnyColumn): SQL => asc(sql`${col} collate "C"`);
export const maxPosition = (col: AnyColumn): SQL<string | null> =>
  sql<string | null>`max(${col} collate "C")`;

/** Assigns only keys that are present, keeping `exactOptionalPropertyTypes` happy. */
export function definedOnly<T extends object>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const key in obj) {
    if (Object.hasOwn(obj, key) && obj[key] !== undefined) out[key] = obj[key];
  }
  return out;
}

/** Builds a safe prefix tsquery string from free text: `foo bar` -> `foo:* & bar:*`. */
export function toPrefixTsQuery(input: string): string | null {
  const tokens = input
    .toLowerCase()
    .match(/[\p{L}\p{N}]+/gu)
    ?.slice(0, 8);
  if (!tokens || tokens.length === 0) return null;
  return tokens.map((t) => `${t}:*`).join(" & ");
}

export function isValidTimeZone(tz: string): boolean {
  if (tz.length > 64) return false;
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: tz }).resolvedOptions().timeZone.length > 0;
  } catch {
    return false;
  }
}

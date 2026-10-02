import { describe, expect, it } from "vitest";

import { safeRedirectPath } from "@/lib/utils/safe-redirect";
import { toPrefixTsQuery } from "@/server/dal/util";

describe("safeRedirectPath", () => {
  it.each([
    ["/boards/abc?task=1", "/boards/abc?task=1"],
    ["/notes", "/notes"],
  ])("allows same-origin path %s", (input, expected) => {
    expect(safeRedirectPath(input)).toBe(expected);
  });

  it.each([
    "//evil.com",
    "/\\evil.com",
    "https://evil.com",
    "javascript:alert(1)",
    "/\u0000x",
    "boards",
    "",
    "/".repeat(600),
    undefined,
    ["/a"],
  ])("rejects %s", (input) => {
    expect(safeRedirectPath(input)).toBe("/boards");
  });
});

describe("toPrefixTsQuery", () => {
  it("builds a prefix query from words", () => {
    expect(toPrefixTsQuery("Hello wor")).toBe("hello:* & wor:*");
  });
  it("strips tsquery operators and punctuation (no injection)", () => {
    expect(toPrefixTsQuery("a' | b & !c <-> (d)")).toBe("a:* & b:* & c:* & d:*");
    expect(toPrefixTsQuery("&|!():*")).toBeNull();
  });
  it("caps the number of terms", () => {
    expect(toPrefixTsQuery("a b c d e f g h i j")?.split("&")).toHaveLength(8);
  });
});

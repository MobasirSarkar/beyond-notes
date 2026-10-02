import { describe, expect, it } from "vitest";

import { comparePosition, keyBetween, keysAfter } from "@/lib/utils/position";

describe("fractional positions", () => {
  it("generates strictly increasing keys", () => {
    const keys = keysAfter(null, 50);
    expect(keys.toSorted()).toEqual(keys);
    expect(new Set(keys).size).toBe(50);
  });

  it("inserts between neighbours", () => {
    const [a, b] = keysAfter(null, 2);
    const mid = keyBetween(a, b);
    expect(mid > (a ?? "") && mid < (b ?? "")).toBe(true);
  });

  it("survives many inserts at the same spot", () => {
    let lo = keyBetween(null, null);
    const hi = keyBetween(lo, null);
    for (let i = 0; i < 200; i++) {
      const next = keyBetween(lo, hi);
      expect(next > lo && next < hi).toBe(true);
      lo = next;
    }
  });

  it("recovers from inverted neighbours instead of throwing", () => {
    const [a, b] = keysAfter(null, 2);
    expect(() => keyBetween(b, a)).not.toThrow();
    expect(keyBetween(b, a) > (b ?? "")).toBe(true);
  });

  it("compares by code unit", () => {
    const items = [{ position: "a1" }, { position: "Zz" }, { position: "a0V" }];
    expect(items.toSorted(comparePosition).map((i) => i.position)).toEqual(["Zz", "a0V", "a1"]);
  });
});

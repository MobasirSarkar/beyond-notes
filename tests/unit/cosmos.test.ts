import { describe, expect, it } from "vitest";

import { countsFor, distantGalaxiesFor, generateGalaxy } from "@/lib/cosmos/generate";
import { STAR_KIND } from "@/types/cosmos";

const kinds = (attributes: Float32Array) =>
  Array.from({ length: attributes.length / 4 }, (_, i) => attributes[i * 4 + 3]);

describe("generateGalaxy", () => {
  const counts = countsFor("ambient", 1440, 900);
  const distant = distantGalaxiesFor("ambient");
  const stars = generateGalaxy(counts, distant);

  it("packs four floats per particle in both buffers", () => {
    expect(stars.positions.length).toBe(stars.count * 4);
    expect(stars.attributes.length).toBe(stars.count * 4);
  });

  it("puts every dust particle last, for the absorption pass", () => {
    const k = kinds(stars.attributes);
    expect(k.slice(stars.dustStart).every((v) => v === STAR_KIND.dust)).toBe(true);
    expect(k.slice(0, stars.dustStart).includes(STAR_KIND.dust)).toBe(false);
  });

  it("adds background galaxies with stars and glows near their anchors", () => {
    const k = kinds(stars.attributes);
    expect(k.filter((v) => v === STAR_KIND.distantGlow).length).toBeGreaterThanOrEqual(
      distant.length * 5,
    );
    expect(k.filter((v) => v === STAR_KIND.distant).length).toBeGreaterThan(distant.length * 50);
    const maxRadius = Math.max(...distant.map((g) => g.radius));
    for (let i = 0; i < stars.count; i++) {
      if (k[i] !== STAR_KIND.distant) continue;
      const offset = Math.hypot(stars.positions[i * 4 + 2] ?? 0, stars.positions[i * 4 + 3] ?? 0);
      expect(offset).toBeLessThan(maxRadius * 2.5);
    }
  });

  it("is deterministic for a given seed", () => {
    const again = generateGalaxy(counts, distant);
    expect(again.positions).toEqual(stars.positions);
  });
});

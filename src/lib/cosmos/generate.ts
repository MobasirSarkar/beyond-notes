import { STAR_KIND, type GalaxyCounts, type StarBuffers } from "@/types/cosmos";

const TAU = Math.PI * 2;
const ARMS = 2;
/** Pitch angle of the logarithmic spiral (≈24°): θ = ln(r / r0) / tan(pitch). */
const WINDING = 1 / Math.tan(0.42);
const ARM_START = 0.045;

/** Small, fast, seedable PRNG so the galaxy looks the same on every visit. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rand: () => number): number {
  const u = Math.max(rand(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * rand());
}

/** Angle of a point on spiral arm `arm` at radius `r`. */
export const armAngle = (arm: number, r: number): number =>
  (arm * TAU) / ARMS + Math.log(Math.max(r, ARM_START) / ARM_START) * WINDING;

/**
 * Builds a two-armed grand-design spiral galaxy: an exponential disk with
 * stars concentrated along logarithmic arms, a 3D Gaussian bulge, soft
 * nebula sprites tracing the arms, and a twinkling foreground star field.
 */
export function generateGalaxy(counts: GalaxyCounts, seed = 7): StarBuffers {
  const rand = mulberry32(seed);
  const count = counts.disk + counts.bulge + counts.nebula + counts.field + counts.dust;
  const positions = new Float32Array(count * 3);
  const attributes = new Float32Array(count * 4);
  let i = 0;

  const push = (
    r: number,
    angle: number,
    y: number,
    size: number,
    brightness: number,
    kind: number,
  ) => {
    positions.set([r, angle, y], i * 3);
    attributes.set([size, brightness, rand() * TAU, kind], i * 4);
    i += 1;
  };

  /** Scatters a polar point in cartesian space and converts back to polar. */
  const scatter = (r: number, theta: number, spread: number): [number, number] => {
    const x = Math.cos(theta) * r + gaussian(rand) * spread;
    const z = Math.sin(theta) * r + gaussian(rand) * spread;
    return [Math.hypot(x, z), Math.atan2(z, x)];
  };

  for (let n = 0; n < counts.disk; n++) {
    const r0 = Math.min(1.3, -Math.log(1 - rand() * 0.985) * 0.24 + 0.03);
    const inArm = rand() < 0.8;
    const theta0 = inArm ? armAngle(Math.floor(rand() * ARMS), r0) : rand() * TAU;
    // Arms are tight near the core and fan out with radius.
    const [r, theta] = scatter(r0, theta0, inArm ? 0.02 + 0.07 * r0 : 0.02);
    const y = gaussian(rand) * (0.01 + 0.05 * Math.exp(-r * 5));
    const size = 0.9 + 1.7 * rand() ** 5 + (inArm ? 0.2 : 0);
    const brightness =
      (0.35 + 0.65 * rand() ** 2.5) * (inArm ? 1 : 0.45) * (0.6 + 0.4 * Math.exp(-r * 1.2));
    push(r, theta, y, size, brightness, STAR_KIND.disk);
  }

  for (let n = 0; n < counts.bulge; n++) {
    const x = gaussian(rand) * 0.1;
    const z = gaussian(rand) * 0.1;
    const y = gaussian(rand) * 0.065;
    push(
      Math.hypot(x, z),
      Math.atan2(z, x),
      y,
      0.6 + 1.1 * rand() ** 4,
      0.3 + 0.7 * rand() ** 2,
      STAR_KIND.bulge,
    );
  }

  // Core halo: a few large, very faint sprites stacked at the centre.
  const coreSprites = Math.min(18, counts.nebula);
  for (let n = 0; n < coreSprites; n++) {
    const size = 0.06 + 0.4 * (n / coreSprites) ** 1.5; // nested, so the core falls off smoothly
    push(rand() * 0.01, rand() * TAU, 0, size, 0.16 - 0.1 * (n / coreSprites), STAR_KIND.nebula);
  }
  // Arm glow: many small, faint clouds that blend into a smooth luminous band,
  // plus a dim diffuse disk between the arms.
  for (let n = coreSprites; n < counts.nebula; n++) {
    if (rand() < 0.18) {
      const r0 = 0.15 + rand() ** 1.5 * 0.9;
      push(r0, rand() * TAU, 0, 0.12 + 0.12 * rand(), 0.012 + 0.01 * rand(), STAR_KIND.nebula);
      continue;
    }
    const r0 = 0.08 + rand() ** 1.2 * 1.0;
    const [r, theta] = scatter(r0, armAngle(Math.floor(rand() * ARMS), r0), 0.015 + 0.045 * r0);
    push(
      r,
      theta,
      gaussian(rand) * 0.008,
      0.03 + 0.07 * rand(),
      0.028 + 0.035 * rand(),
      STAR_KIND.nebula,
    );
  }

  for (let n = 0; n < counts.field; n++) {
    const bright = rand() < 0.025;
    const size = bright ? 2.2 + rand() * 1.2 : 0.5 + 1.2 * rand() ** 8;
    const brightness = bright ? 0.75 + 0.25 * rand() : 0.12 + 0.55 * rand() ** 4;
    positions.set([rand() * 2.2 - 1.1, rand() * 2.2 - 1.1, rand()], i * 3);
    attributes.set([size, brightness, rand() * TAU, STAR_KIND.field], i * 4);
    i += 1;
  }

  // Dust lanes hug the inner (trailing) edge of each arm and absorb light.
  const dustStart = i;
  for (let n = 0; n < counts.dust; n++) {
    const r0 = 0.12 + rand() ** 1.1 * 0.85;
    const [r, theta] = scatter(
      r0,
      armAngle(Math.floor(rand() * ARMS), r0) - 0.32,
      0.01 + 0.02 * r0,
    );
    push(
      r,
      theta,
      gaussian(rand) * 0.004,
      0.025 + 0.045 * rand(),
      0.07 + 0.08 * rand(),
      STAR_KIND.dust,
    );
  }

  return { positions, attributes, count, dustStart };
}

/** Scales particle counts to the canvas area so small screens stay cheap. */
export function countsFor(
  variant: "hero" | "ambient",
  cssWidth: number,
  cssHeight: number,
): GalaxyCounts {
  const f = Math.min(1.25, Math.max(0.35, (cssWidth * cssHeight) / (1440 * 900)));
  const base =
    variant === "hero"
      ? { disk: 30_000, bulge: 5_000, nebula: 1_500, field: 1_600, dust: 1_100 }
      : { disk: 18_000, bulge: 3_500, nebula: 900, field: 1_100, dust: 650 };
  return {
    disk: Math.round(base.disk * f),
    bulge: Math.round(base.bulge * f),
    nebula: Math.round(base.nebula * Math.sqrt(f)),
    field: Math.round(base.field * f),
    dust: Math.round(base.dust * Math.sqrt(f)),
  };
}

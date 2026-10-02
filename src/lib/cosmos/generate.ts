import {
  STAR_KIND,
  type CosmosVariant,
  type DistantGalaxy,
  type GalaxyCounts,
  type StarBuffers,
} from "@/types/cosmos";

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

/** Glow sprites per background galaxy: nested core glows plus clouds along its structure. */
const CORE_GLOWS = 5;
const structureGlows = (g: DistantGalaxy) =>
  g.shape === "spiral" ? 48 : g.shape === "edge-on" ? 14 : 0;
const distantStars = (g: DistantGalaxy, scale: number) => Math.max(60, Math.round(g.stars * scale));
const distantSize = (g: DistantGalaxy, scale: number) =>
  distantStars(g, scale) + CORE_GLOWS + structureGlows(g);

/**
 * Builds a two-armed grand-design spiral galaxy: an exponential disk with
 * stars concentrated along logarithmic arms, a 3D Gaussian bulge, soft
 * nebula sprites tracing the arms, a twinkling foreground star field and a
 * handful of small, distant galaxies that give the empty sky depth.
 */
export function generateGalaxy(
  counts: GalaxyCounts,
  distant: readonly DistantGalaxy[] = [],
  seed = 7,
): StarBuffers {
  const rand = mulberry32(seed);
  const distantCount = distant.reduce((n, g) => n + distantSize(g, counts.distant), 0);
  const count =
    counts.disk + counts.bulge + counts.nebula + counts.field + distantCount + counts.dust;
  const positions = new Float32Array(count * 4);
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
    positions.set([r, angle, y, 0], i * 4);
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
    positions.set([rand() * 2.2 - 1.1, rand() * 2.2 - 1.1, rand(), 0], i * 4);
    attributes.set([size, brightness, rand() * TAU, STAR_KIND.field], i * 4);
    i += 1;
  }

  // Background galaxies, drawn before dust (which must stay last).
  const pushDistant = (
    g: DistantGalaxy,
    x: number,
    y: number,
    size: number,
    brightness: number,
    kind: number,
  ) => {
    // Incline (squash the minor axis), then rotate to the position angle.
    const ys = y * g.axisRatio;
    const ca = Math.cos(g.angle);
    const sa = Math.sin(g.angle);
    positions.set(
      [g.anchor[0], g.anchor[1], (x * ca - ys * sa) * g.radius, (x * sa + ys * ca) * g.radius],
      i * 4,
    );
    attributes.set([size, brightness * g.brightness, rand() * TAU, kind], i * 4);
    i += 1;
  };
  for (const g of distant) {
    const stars = distantStars(g, counts.distant);
    for (let n = 0; n < stars; n++) {
      let x: number;
      let y: number;
      if (g.shape === "spiral") {
        if (rand() < 0.16) {
          x = gaussian(rand) * 0.07;
          y = gaussian(rand) * 0.07;
        } else {
          // Arms run out to the full radius; a thin exponential disk fills between.
          const inArm = rand() < 0.78;
          const r0 = inArm
            ? 0.06 + rand() ** 0.85 * 0.94
            : Math.min(1, -Math.log(1 - rand() * 0.95) * 0.32);
          const theta = inArm ? armAngle(Math.floor(rand() * ARMS), r0 * 0.9) : rand() * TAU;
          const spread = 0.025 + 0.06 * r0;
          x = Math.cos(theta) * r0 + gaussian(rand) * spread;
          y = Math.sin(theta) * r0 + gaussian(rand) * spread;
        }
      } else if (g.shape === "edge-on") {
        const bulge = rand() < 0.25;
        x = bulge ? gaussian(rand) * 0.12 : gaussian(rand) * 0.45;
        y = bulge ? gaussian(rand) * 0.08 : gaussian(rand) * 0.03;
      } else {
        // Elliptical: smooth de Vaucouleurs-like falloff.
        const r0 = rand() ** 1.8 * 0.95;
        const theta = rand() * TAU;
        x = Math.cos(theta) * r0;
        y = Math.sin(theta) * r0;
      }
      const centre = Math.exp(-Math.hypot(x, y) * 3);
      pushDistant(
        g,
        x,
        y,
        0.8 + 1.0 * rand() ** 4 + centre * 0.5,
        (0.35 + 0.5 * rand() ** 2) * (0.6 + 0.4 * centre),
        STAR_KIND.distant,
      );
    }
    // Soft clouds trace the arms (or the disk of an edge-on) so the structure
    // reads as light, not just as scattered points.
    for (let n = 0; n < structureGlows(g); n++) {
      if (g.shape === "spiral") {
        const r0 = 0.15 + rand() ** 1.1 * 0.8;
        const theta = armAngle(Math.floor(rand() * ARMS), r0 * 0.9);
        const x = Math.cos(theta) * r0 + gaussian(rand) * 0.04;
        const y = Math.sin(theta) * r0 + gaussian(rand) * 0.04;
        pushDistant(
          g,
          x,
          y,
          g.radius * (0.22 + 0.2 * rand()),
          0.05 + 0.04 * rand(),
          STAR_KIND.distantGlow,
        );
      } else {
        pushDistant(
          g,
          gaussian(rand) * 0.35,
          0,
          g.radius * (0.3 + 0.2 * rand()),
          0.05,
          STAR_KIND.distantGlow,
        );
      }
    }
    // Nested glows give each galaxy a luminous core and a soft disk.
    for (let n = 0; n < CORE_GLOWS; n++) {
      const t = n / (CORE_GLOWS - 1);
      pushDistant(
        g,
        0,
        0,
        g.radius * (0.2 + 1.7 * t ** 1.4),
        0.2 - 0.15 * t,
        STAR_KIND.distantGlow,
      );
    }
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
  variant: CosmosVariant,
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
    distant: f,
  };
}

/** Compact constructor for the composition tables below. */
const g = (
  shape: DistantGalaxy["shape"],
  anchor: readonly [number, number],
  radius: number,
  axisRatio: number,
  angle: number,
  stars: number,
  brightness: number,
): DistantGalaxy => ({ shape, anchor, radius, axisRatio, angle, stars, brightness });

/**
 * Background galaxies per variant, composed around the main spiral: the hero
 * keeps them clear of the headline; the app fills the sky the main galaxy
 * leaves empty (it sits bottom-right), starting with the top-left corner.
 */
export function distantGalaxiesFor(variant: CosmosVariant): readonly DistantGalaxy[] {
  if (variant === "hero") {
    return [
      g("spiral", [-0.8, 0.76], 0.18, 0.5, 0.6, 2_200, 0.9),
      g("edge-on", [0.88, 0.84], 0.11, 1, -0.35, 800, 0.85),
      g("elliptical", [-0.55, -0.82], 0.065, 0.7, 0.4, 500, 0.75),
      g("spiral", [0.1, -0.86], 0.06, 0.9, 1.2, 450, 0.65),
      g("elliptical", [-0.25, 0.9], 0.03, 0.55, -0.5, 200, 0.55),
    ];
  }
  return [
    g("spiral", [-0.86, 0.6], 0.4, 0.48, 0.55, 4_800, 1),
    g("edge-on", [0.02, 0.78], 0.16, 1, -0.28, 1_200, 0.9),
    g("elliptical", [-0.86, -0.3], 0.09, 0.65, 0.3, 700, 0.8),
    g("spiral", [0.45, 0.58], 0.11, 0.85, 2.1, 1_100, 0.8),
    g("elliptical", [-0.25, 0.08], 0.045, 0.5, -0.7, 300, 0.6),
    g("edge-on", [0.08, -0.5], 0.07, 1, 0.5, 360, 0.6),
  ];
}

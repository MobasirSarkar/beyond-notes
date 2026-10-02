/**
 * Particle kinds understood by the galaxy shader. `distant` / `distantGlow`
 * belong to the small background galaxies, which live in screen space.
 */
export const STAR_KIND = {
  disk: 0,
  bulge: 1,
  nebula: 2,
  field: 3,
  dust: 4,
  distant: 5,
  distantGlow: 6,
} as const;
export type StarKind = (typeof STAR_KIND)[keyof typeof STAR_KIND];

/** How many particles of each kind to generate. */
export type GalaxyCounts = {
  disk: number;
  bulge: number;
  nebula: number;
  field: number;
  dust: number;
  /** Multiplier for the background galaxies' star counts (scales with screen area). */
  distant: number;
};

/** A small background galaxy, placed by composition rather than simulated. */
export type DistantGalaxy = {
  shape: "spiral" | "elliptical" | "edge-on";
  /** Centre in normalised device coordinates (-1..1). */
  anchor: readonly [number, number];
  /** Radius as a fraction of half the viewport's shorter side. */
  radius: number;
  /** Minor/major axis ratio: 1 is face-on, small values are steeply inclined. */
  axisRatio: number;
  /** Position angle of the major axis, radians. */
  angle: number;
  /** Star count before area scaling. */
  stars: number;
  /** Overall brightness multiplier (0..1). */
  brightness: number;
};

/**
 * Vertex data, four floats per particle in each array. `positions` holds
 * (radius, angle, height, 0) for the main galaxy, (ndcX, ndcY, depth, 0) for
 * field stars and (anchorX, anchorY, offsetX, offsetY) for background
 * galaxies, offsets in half-shorter-side units. `attributes`: (size,
 * brightness, phase, kind).
 */
export type StarBuffers = {
  positions: Float32Array;
  attributes: Float32Array;
  count: number;
  /** Index where light-absorbing dust starts (drawn in a second, inverted-blend pass). */
  dustStart: number;
};

/** Where and how the galaxy sits in the viewport. */
export type GalaxyLayout = {
  /** Galaxy centre in normalised device coordinates (-1..1). */
  center: readonly [number, number];
  /** Galaxy radius as a fraction of half the viewport's shorter side. */
  scale: number;
  /** Tilt from edge-on, radians (π/2 is face-on). */
  tilt: number;
  /** In-plane rotation of the whole image, radians. */
  roll: number;
};

/** Per-frame camera/animation state fed to the renderer. */
export type GalaxyFrame = GalaxyLayout & {
  time: number;
  yaw: number;
  camera: number;
  reveal: number;
  gain: number;
  spin: number;
};

export type CosmosVariant = "hero" | "ambient";

export type ThemeInk = {
  background: readonly [number, number, number];
  ink: readonly [number, number, number];
  light: boolean;
};

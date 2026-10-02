/** Particle kinds understood by the galaxy shader. */
export const STAR_KIND = { disk: 0, bulge: 1, nebula: 2, field: 3, dust: 4 } as const;
export type StarKind = (typeof STAR_KIND)[keyof typeof STAR_KIND];

/** How many particles of each kind to generate. */
export type GalaxyCounts = {
  disk: number;
  bulge: number;
  nebula: number;
  field: number;
  dust: number;
};

/**
 * Interleaved vertex data. `positions`: (radius, angle, height) for galaxy
 * particles or (ndcX, ndcY, depth) for field stars. `attributes`:
 * (size, brightness, phase, kind).
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

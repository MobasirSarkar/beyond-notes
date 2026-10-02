/** GLSL ES 1.0 so it runs on every WebGL-capable device. */

export const VERTEX_SHADER = /* glsl */ `
attribute vec4 a_pos;
attribute vec4 a_attr; // size, brightness, phase, kind

uniform float u_time;
uniform float u_spin;
uniform vec2 u_resolution; // device px
uniform float u_dpr;
uniform vec2 u_center;
uniform float u_scale;
uniform float u_tilt;
uniform float u_yaw;
uniform float u_roll;
uniform float u_camera;
uniform float u_reveal;
uniform float u_gain;

varying float v_alpha;
varying float v_kind;
varying float v_spike;

const float FOCAL = 2.4;

void main() {
  float size = a_attr.x;
  float brightness = a_attr.y;
  float phase = a_attr.z;
  float kind = a_attr.w;
  float minDim = min(u_resolution.x, u_resolution.y);
  vec2 toNdc = vec2(minDim / u_resolution.x, minDim / u_resolution.y);

  if (kind > 2.5 && kind < 3.5) {
    // Foreground field star: fixed in screen space with gentle depth parallax.
    vec2 p = a_pos.xy + vec2(u_yaw, -(u_tilt - 1.1)) * 0.04 * (0.3 + a_pos.z);
    gl_Position = vec4(p, 0.0, 1.0);
    float twinkle = 0.72 + 0.28 * sin(u_time * (0.7 + phase * 0.25) + phase * 17.0);
    v_alpha = brightness * twinkle * u_reveal * u_gain;
    v_spike = step(2.0, size);
    gl_PointSize = size * u_dpr * (v_spike > 0.5 ? 5.0 : 1.0);
    v_kind = kind;
    return;
  }

  if (kind > 4.5) {
    // Background galaxy (5: star, 6: glow): an anchor plus an offset measured in
    // half-shorter-side units, so shapes keep their proportions at any aspect
    // ratio. Very far away, so the parallax is a fraction of the field stars'.
    vec2 p = a_pos.xy + a_pos.zw * toNdc + vec2(u_yaw, -(u_tilt - 1.1)) * 0.012;
    gl_Position = vec4(p, 0.0, 1.0);
    gl_PointSize = kind > 5.5 ? min(size * minDim * 0.5, 640.0) : size * u_dpr;
    v_alpha = brightness * u_reveal * u_gain;
    v_kind = kind;
    v_spike = 0.0;
    return;
  }

  // Galaxy particle: rigid pattern rotation, slightly faster in the bulge.
  float r = a_pos.x;
  float omega = u_spin * (1.0 + 0.6 * exp(-r * 9.0));
  float theta = a_pos.y + u_time * omega;
  vec3 p = vec3(cos(theta) * r, a_pos.z, sin(theta) * r);

  // Tilt (around x), then yaw (around y) for parallax.
  float ct = cos(u_tilt), st = sin(u_tilt);
  p = vec3(p.x, p.y * ct - p.z * st, p.y * st + p.z * ct);
  float cy = cos(u_yaw), sy = sin(u_yaw);
  p = vec3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy);

  float depth = u_camera + p.z;
  float persp = FOCAL / max(depth, 0.2);
  vec2 xy = p.xy * persp;
  // Roll the whole image for a diagonal composition.
  float cr = cos(u_roll), sr = sin(u_roll);
  xy = vec2(xy.x * cr - xy.y * sr, xy.x * sr + xy.y * cr);

  gl_Position = vec4(xy * u_scale * toNdc + u_center, 0.0, 1.0);

  float nearness = clamp(persp / (FOCAL / u_camera), 0.55, 1.8);
  if (kind > 1.5) {
    // Nebula/dust sprite: size is in galaxy units, so it scales with the view.
    gl_PointSize = min(size * persp * u_scale * minDim * 0.5, 640.0);
  } else {
    gl_PointSize = size * u_dpr * nearness;
  }
  // Fade stars on the far side of the disk for depth.
  float atmosphere = smoothstep(u_camera + 1.4, u_camera - 0.6, depth);
  v_alpha = brightness * u_reveal * u_gain * mix(0.45, 1.0, atmosphere);
  v_kind = kind;
  v_spike = 0.0;
}
`;

export const FRAGMENT_SHADER = /* glsl */ `
precision mediump float;

uniform vec3 u_ink;

varying float v_alpha;
varying float v_kind;
varying float v_spike;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d2 = dot(c, c) * 4.0;
  if (d2 > 1.0) discard;

  // Soft sprites: nebula (2), dust (4) and background-galaxy glows (6).
  bool soft = (v_kind > 1.5 && v_kind < 2.5) || (v_kind > 3.5 && v_kind < 4.5) || v_kind > 5.5;
  bool dust = v_kind > 3.5 && v_kind < 4.5;

  float a;
  if (soft) {
    // Wide, soft Gaussian.
    a = exp(-d2 * 3.2) * (1.0 - d2);
  } else if (v_spike > 0.5) {
    // Bright field star: tight core, halo and 4-point diffraction spikes.
    vec2 q = abs(c) * 2.0;
    float core = exp(-d2 * 60.0);
    float halo = exp(-d2 * 9.0) * 0.18;
    float spikes = (exp(-q.x * 70.0) * exp(-q.y * 2.6) + exp(-q.y * 70.0) * exp(-q.x * 2.6)) * 0.55;
    a = core + halo + spikes * (1.0 - d2);
  } else {
    // Star: bright core plus a faint halo.
    a = exp(-d2 * 7.0) + 0.12 * exp(-d2 * 2.0) * (1.0 - d2);
  }
  // Dust outputs a neutral absorption amount; light is tinted by the theme ink.
  vec3 color = dust ? vec3(a * v_alpha) : u_ink * a * v_alpha;
  gl_FragColor = vec4(color, 1.0);
}
`;

/** Full-screen triangle used to composite the sky colour after the galaxy. */
export const SKY_VERTEX_SHADER = /* glsl */ `
attribute vec2 a_corner;
void main() {
  gl_Position = vec4(a_corner, 0.0, 1.0);
}
`;

export const SKY_FRAGMENT_SHADER = /* glsl */ `
precision mediump float;
uniform vec3 u_sky;
void main() {
  gl_FragColor = vec4(u_sky, 1.0);
}
`;

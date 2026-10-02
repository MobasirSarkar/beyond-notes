import type { GalaxyFrame, StarBuffers, ThemeInk } from "@/types/cosmos";

import { FRAGMENT_SHADER, SKY_FRAGMENT_SHADER, SKY_VERTEX_SHADER, VERTEX_SHADER } from "./shaders";

const UNIFORMS = [
  "u_time",
  "u_spin",
  "u_resolution",
  "u_dpr",
  "u_center",
  "u_scale",
  "u_tilt",
  "u_yaw",
  "u_roll",
  "u_camera",
  "u_reveal",
  "u_gain",
  "u_ink",
] as const;
type UniformName = (typeof UNIFORMS)[number];

export type GalaxyRenderer = {
  setStars: (stars: StarBuffers) => void;
  setTheme: (theme: ThemeInk) => void;
  resize: (cssWidth: number, cssHeight: number, dpr: number) => void;
  render: (frame: GalaxyFrame) => void;
  dispose: () => void;
};

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Could not create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? "unknown error";
    gl.deleteShader(shader);
    throw new Error(`Shader compile failed: ${log}`);
  }
  return shader;
}

/**
 * Minimal WebGL point renderer for the galaxy. All motion happens in the
 * vertex shader, so a frame is a handful of uniform writes and one draw call.
 * Dark themes blend additively (light emits); light themes subtract from the
 * paper colour, like ink on a photographic plate.
 */
export function createGalaxyRenderer(canvas: HTMLCanvasElement): GalaxyRenderer | null {
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    powerPreference: "low-power",
  });
  // A canvas hands back the same context forever; once lost, it can't draw.
  if (!gl || gl.isContextLost()) return null;

  const link = (vertex: string, fragment: string): WebGLProgram | null => {
    try {
      const p = gl.createProgram();
      gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vertex));
      gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fragment));
      gl.linkProgram(p);
      return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
    } catch {
      return null;
    }
  };
  const program = link(VERTEX_SHADER, FRAGMENT_SHADER);
  const skyProgram = link(SKY_VERTEX_SHADER, SKY_FRAGMENT_SHADER);
  if (!program || !skyProgram) return null;

  // Sky pass: one oversized triangle covering the viewport.
  const skyBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, skyBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aCorner = gl.getAttribLocation(skyProgram, "a_corner");
  const uSky = gl.getUniformLocation(skyProgram, "u_sky");
  gl.useProgram(program);

  const locations = new Map<UniformName, WebGLUniformLocation | null>(
    UNIFORMS.map((name) => [name, gl.getUniformLocation(program, name)]),
  );
  const loc = (name: UniformName) => locations.get(name) ?? null;
  const positionBuffer = gl.createBuffer();
  const attributeBuffer = gl.createBuffer();
  const aPos = gl.getAttribLocation(program, "a_pos");
  const aAttr = gl.getAttribLocation(program, "a_attr");
  let count = 0;
  let dustStart = 0;
  let light = false;
  let width = 1;
  let height = 1;
  let ratio = 1;
  let background: readonly [number, number, number] = [0, 0, 0];

  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);

  const bindStars = () => {
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 4, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, attributeBuffer);
    gl.enableVertexAttribArray(aAttr);
    gl.vertexAttribPointer(aAttr, 4, gl.FLOAT, false, 0, 0);
  };

  return {
    setStars(stars) {
      count = stars.count;
      dustStart = stars.dustStart;
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, stars.positions, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, attributeBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, stars.attributes, gl.STATIC_DRAW);
    },
    setTheme(theme) {
      background = theme.background;
      light = theme.light;
      gl.useProgram(program);
      gl.uniform3f(loc("u_ink"), theme.ink[0], theme.ink[1], theme.ink[2]);
    },
    resize(cssWidth, cssHeight, dpr) {
      ratio = dpr;
      width = Math.max(1, Math.floor(cssWidth * dpr));
      height = Math.max(1, Math.floor(cssHeight * dpr));
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    },
    render(f) {
      // Galaxy light is built on a neutral base, dust absorbs only that light,
      // and the sky colour is composited last — so dust never darkens the sky.
      const base = light ? 1 : 0;
      gl.clearColor(base, base, base, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      bindStars();
      gl.uniform1f(loc("u_time"), f.time);
      gl.uniform1f(loc("u_spin"), f.spin);
      gl.uniform2f(loc("u_resolution"), width, height);
      gl.uniform1f(loc("u_dpr"), ratio);
      gl.uniform2f(loc("u_center"), f.center[0], f.center[1]);
      gl.uniform1f(loc("u_scale"), f.scale);
      gl.uniform1f(loc("u_tilt"), f.tilt);
      gl.uniform1f(loc("u_yaw"), f.yaw);
      gl.uniform1f(loc("u_roll"), f.roll);
      gl.uniform1f(loc("u_camera"), f.camera);
      gl.uniform1f(loc("u_reveal"), f.reveal);
      gl.uniform1f(loc("u_gain"), f.gain);
      // 1. Light: dark themes add it; light themes subtract ink from white.
      gl.blendEquation(light ? gl.FUNC_REVERSE_SUBTRACT : gl.FUNC_ADD);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.drawArrays(gl.POINTS, 0, dustStart);

      // 2. Dust scales the light down by (1 - a): dst·(1−a) or 1 − (1−dst)(1−a).
      gl.blendEquation(gl.FUNC_ADD);
      if (light) gl.blendFunc(gl.ONE_MINUS_DST_COLOR, gl.ONE);
      else gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_COLOR);
      gl.drawArrays(gl.POINTS, dustStart, count - dustStart);

      // 3. Sky: add it (dark) or multiply by it (light).
      gl.useProgram(skyProgram);
      gl.bindBuffer(gl.ARRAY_BUFFER, skyBuffer);
      gl.disableVertexAttribArray(aAttr);
      gl.enableVertexAttribArray(aCorner);
      gl.vertexAttribPointer(aCorner, 2, gl.FLOAT, false, 0, 0);
      gl.uniform3f(uSky, background[0], background[1], background[2]);
      if (light) gl.blendFunc(gl.DST_COLOR, gl.ZERO);
      else gl.blendFunc(gl.ONE, gl.ONE);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.disableVertexAttribArray(aCorner);
    },
    dispose() {
      gl.deleteBuffer(positionBuffer);
      gl.deleteBuffer(attributeBuffer);
      gl.deleteBuffer(skyBuffer);
      gl.deleteProgram(program);
      gl.deleteProgram(skyProgram);
      // Never force-lose the context here: React (Strict Mode, fast refresh)
      // can mount again on this same canvas, and a lost context is permanent.
    },
  };
}

/** Resolves any CSS colour (including oklch tokens) to linear-ish RGB 0..1 via a 1×1 canvas. */
export function cssColorToRgb(color: string): [number, number, number] {
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!ctx) return [0, 0, 0];
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
}

/** Reads `--bg` / `--fg` and derives the ink and blend mode for the current theme. */
export function readThemeInk(): ThemeInk {
  const styles = getComputedStyle(document.documentElement);
  const background = cssColorToRgb(styles.getPropertyValue("--bg").trim());
  const foreground = cssColorToRgb(styles.getPropertyValue("--fg").trim());
  const light =
    background[0] + background[1] + background[2] > foreground[0] + foreground[1] + foreground[2];
  // Dark: sky + ink·L reaches the foreground. Light: sky·(1 − ink·L) reaches it.
  const channel = (i: 0 | 1 | 2) =>
    light ? 1 - foreground[i] / Math.max(background[i], 1e-3) : foreground[i] - background[i];
  const ink: [number, number, number] = [channel(0), channel(1), channel(2)];
  return { background, ink, light };
}

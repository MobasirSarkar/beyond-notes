"use client";

import { animate, createTimer } from "animejs";
import { useEffect, useRef, useState } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { countsFor, generateGalaxy } from "@/lib/cosmos/generate";
import { createGalaxyRenderer, readThemeInk } from "@/lib/cosmos/renderer";
import { cn } from "@/lib/utils/cn";
import type { CosmosVariant, GalaxyFrame, GalaxyLayout } from "@/types/cosmos";

type Props = { variant: CosmosVariant; className?: string };

const SETTINGS = {
  hero: { fps: 60, maxDpr: 1.75, spin: 0.032, gain: { dark: 1, light: 0.85 } },
  ambient: { fps: 30, maxDpr: 1.25, spin: 0.012, gain: { dark: 0.7, light: 0.5 } },
} as const;

/** Composition per variant and viewport shape. */
function layoutFor(variant: CosmosVariant, width: number, height: number): GalaxyLayout {
  const portrait = height > width * 1.1;
  if (variant === "hero") {
    return portrait
      ? { center: [0.2, -0.4], scale: 1.25, tilt: 0.95, roll: -0.5 }
      : { center: [0.42, -0.04], scale: 1.08, tilt: 0.92, roll: -0.55 };
  }
  return portrait
    ? { center: [0.55, -0.72], scale: 1.45, tilt: 1.0, roll: -0.55 }
    : { center: [0.66, -0.6], scale: 1.4, tilt: 0.98, roll: -0.55 };
}

/**
 * A procedurally generated, monochrome spiral galaxy rendered with WebGL.
 * ~30k stars rotate on the GPU; the camera dollies in on first load, follows
 * the pointer with eased parallax and (hero) tips edge-on as you scroll.
 */
export function Cosmos({ variant, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  // Bumped when the browser restores a lost WebGL context, to rebuild the scene.
  const [contextEpoch, setContextEpoch] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onLost = (e: Event) => {
      e.preventDefault(); // signals we'll handle restoration
      delete canvas.dataset["ready"];
    };
    const onRestored = () => setContextEpoch((n) => n + 1);
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    return () => {
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = createGalaxyRenderer(canvas);
    if (!renderer) return; // No WebGL: the plain token background shows instead.

    const cfg = SETTINGS[variant];
    let theme = readThemeInk();
    renderer.setTheme(theme);

    let layout = layoutFor(variant, window.innerWidth, window.innerHeight);
    const sizeAndSeed = () => {
      const rect = canvas.getBoundingClientRect();
      renderer.resize(rect.width, rect.height, Math.min(window.devicePixelRatio || 1, cfg.maxDpr));
      layout = layoutFor(variant, rect.width, rect.height);
      return rect;
    };
    const rect = sizeAndSeed();
    renderer.setStars(generateGalaxy(countsFor(variant, rect.width, rect.height)));

    // Animated view state (tweened by anime.js, eased toward pointer/scroll targets).
    const view = {
      reveal: reduced ? 1 : 0,
      camera: reduced ? 2.9 : 4.6,
      tiltOffset: reduced ? 0 : 0.18,
    };
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    let scroll = 0;
    let time = 18; // start mid-rotation so the first frame is already composed

    const frame = (): GalaxyFrame => ({
      ...layout,
      center: [layout.center[0], layout.center[1] + (variant === "hero" ? scroll * 0.35 : 0)],
      tilt:
        layout.tilt + view.tiltOffset - pointer.y * 0.08 - (variant === "hero" ? scroll * 0.55 : 0),
      yaw: pointer.x * 0.12,
      time,
      camera: view.camera,
      reveal: view.reveal,
      gain: theme.light ? cfg.gain.light : cfg.gain.dark,
      spin: cfg.spin,
    });
    const draw = () => renderer.render(frame());

    const onThemeChange = () => {
      theme = readThemeInk();
      renderer.setTheme(theme);
      draw();
    };
    const themeObserver = new MutationObserver(onThemeChange);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    const scheme = window.matchMedia("(prefers-color-scheme: dark)");
    scheme.addEventListener("change", onThemeChange);

    let resizeFrame = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        sizeAndSeed();
        draw();
      });
    };
    window.addEventListener("resize", onResize);

    const teardownBase = () => {
      cancelAnimationFrame(resizeFrame);
      themeObserver.disconnect();
      scheme.removeEventListener("change", onThemeChange);
      window.removeEventListener("resize", onResize);
      delete canvas.dataset["ready"];
      renderer.dispose();
    };

    canvas.dataset["ready"] = "true";
    if (reduced) {
      draw();
      return teardownBase;
    }

    const onPointer = (e: PointerEvent) => {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const onScroll = () => {
      scroll = Math.min(1, window.scrollY / Math.max(1, window.innerHeight));
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    if (variant === "hero") window.addEventListener("scroll", onScroll, { passive: true });

    const intro = animate(view, {
      reveal: 1,
      camera: 2.9,
      tiltOffset: 0,
      duration: variant === "hero" ? 3200 : 1800,
      ease: "outExpo",
    });

    let last = performance.now();
    const timer = createTimer({
      frameRate: cfg.fps,
      loop: true,
      duration: 1e9,
      onUpdate: () => {
        const now = performance.now();
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;
        time += dt;
        // Critically damped easing toward the pointer target.
        const k = 1 - Math.exp(-dt * 2.5);
        pointer.x += (pointer.tx - pointer.x) * k;
        pointer.y += (pointer.ty - pointer.y) * k;
        draw();
      },
    });

    let visible = true;
    const sync = () => {
      if (visible && !document.hidden) {
        last = performance.now();
        timer.resume();
      } else timer.pause();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      sync();
    });
    observer.observe(canvas);
    document.addEventListener("visibilitychange", sync);

    return () => {
      intro.revert();
      timer.revert();
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
      teardownBase();
    };
  }, [variant, reduced, contextEpoch]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn(
        "size-full opacity-0 transition-opacity duration-(--dur-3) data-[ready=true]:opacity-100",
        className,
      )}
    />
  );
}

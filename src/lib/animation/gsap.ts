"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";

gsap.registerPlugin(useGSAP, ScrambleTextPlugin);

export { gsap, useGSAP };

/** Glyph sets used by scramble effects. */
export const GLYPHS = {
  ascii: "/\\|_-=+*#<>",
  blocks: "░▒▓█",
  lower: "abcdefghijklmnopqrstuvwxyz",
} as const;

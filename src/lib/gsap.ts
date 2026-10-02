"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { TextPlugin } from "gsap/TextPlugin";

gsap.registerPlugin(useGSAP, ScrambleTextPlugin, TextPlugin, Flip);

export { Flip, gsap, useGSAP };

/** Glyph sets used by scramble effects. */
export const GLYPHS = {
  blocks: "█▓▒░▄▀▌▐",
  ascii: "!<>-_\\/[]{}—=+*^?#________",
  binary: "01",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
} as const;

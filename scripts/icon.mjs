// Generates the pixel-art app icon (SVG) + PNG sizes via headless Chromium.
// Usage: node scripts/icon.mjs
import { writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const G = "#ededed"; // ink (monochrome)
const A = "#ededed"; // cursor
const BG = "#171717";

// 16x16 pixel art: a terminal window with text lines and a block cursor.
const ART = [
  "................",
  ".GGGGGGGGGGGGGG.",
  ".G............G.",
  ".GGGGGGGGGGGGGG.",
  ".G............G.",
  ".G.GG.GGGG....G.",
  ".G............G.",
  ".G.GGGGG.GG...G.",
  ".G............G.",
  ".G.GGG.GGGGG..G.",
  ".G............G.",
  ".G.GG.AA......G.",
  ".G....AA......G.",
  ".G............G.",
  ".GGGGGGGGGGGGGG.",
  "................",
];

function svg({ padding = 0, size = 512 } = {}) {
  const px = (size - padding * 2) / 16;
  let rects = "";
  ART.forEach((row, y) =>
    [...row].forEach((c, x) => {
      if (c === ".") return;
      const fill = c === "A" ? A : G;
      rects += `<rect x="${padding + x * px}" y="${padding + y * px}" width="${px}" height="${px}" fill="${fill}"/>`;
    }),
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="${BG}"/>${rects}</svg>`;
}

writeFileSync("public/icons/icon.svg", svg());

const targets = [
  ["icon-192.png", 192, 0],
  ["icon-512.png", 512, 0],
  ["apple-touch-icon.png", 180, 18],
  ["maskable-512.png", 512, 80],
  ["badge-96.png", 96, 0],
];

const browser = await chromium.launch(
  process.env["PW_CHROMIUM_PATH"] ? { executablePath: process.env["PW_CHROMIUM_PATH"] } : {},
);
const page = await browser.newPage();
for (const [name, size, pad] of targets) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<html><body style="margin:0">${svg({ size, padding: pad })}</body></html>`,
  );
  await page.screenshot({ path: `public/icons/${name}`, omitBackground: false });
}
await browser.close();
console.log("icons written");

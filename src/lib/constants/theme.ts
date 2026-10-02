/**
 * Literal colors are only needed where the platform can't read CSS variables
 * (browser chrome theme-color, the web manifest, generated icons). Keep them
 * in sync with the `--bg` tokens in `globals.css`.
 */
export const CHROME_COLOR = { light: "#fafafa", dark: "#0a0a0a" } as const;

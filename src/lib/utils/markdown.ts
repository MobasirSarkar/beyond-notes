/** Strips common Markdown syntax for plain-text excerpts. */
export function plainExcerpt(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`~[\]()!|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

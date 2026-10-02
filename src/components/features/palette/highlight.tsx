/** Renders `«match»` sentinels from Postgres ts_headline as <mark>, without HTML injection. */
export function Highlight({ text }: { text: string }) {
  const parts = text.split(/(«[^»]*»)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("«") && part.endsWith("»") ? (
          <mark key={i} className="bg-fg text-bg">
            {part.slice(1, -1)}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

import { AsciiSpinner } from "@/components/ascii/ascii-spinner";

export default function Loading() {
  return (
    <div className="term flex items-center gap-3 p-8 text-2xl text-fg-dim">
      <AsciiSpinner /> loading board…
    </div>
  );
}

import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <p className="flex items-center gap-3 text-sm text-muted">
      <Spinner /> loading board…
    </p>
  );
}

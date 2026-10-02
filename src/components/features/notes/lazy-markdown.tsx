"use client";

import dynamic from "next/dynamic";

import { Spinner } from "@/components/ui/spinner";

/** The Markdown pipeline is ~50 kB; load it only where a preview is shown. */
export const LazyMarkdown = dynamic(() => import("./markdown").then((m) => m.Markdown), {
  ssr: false,
  loading: () => <Spinner className="text-muted" label="Rendering" />,
});

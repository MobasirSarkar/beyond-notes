import type { Metadata } from "next";

import { StatsView } from "@/components/features/stats/stats-view";

export const metadata: Metadata = { title: "Stats" };

export default function StatsPage() {
  return <StatsView />;
}

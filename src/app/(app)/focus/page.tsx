import type { Metadata } from "next";

import { FocusView } from "@/components/features/focus/focus-view";
import { idSchema } from "@/lib/schemas/input";

export const metadata: Metadata = { title: "Focus" };

export default async function FocusPage({ searchParams }: PageProps<"/focus">) {
  const { task } = await searchParams;
  const parsed = idSchema.safeParse(task);
  return <FocusView initialTaskId={parsed.success ? parsed.data : null} />;
}

import type { Metadata } from "next";

import { FocusTimerClient } from "@/components/focus/focus-timer-client";
import { idSchema } from "@/lib/validation";

export const metadata: Metadata = { title: "Focus" };

export default async function FocusPage({ searchParams }: PageProps<"/focus">) {
  const { task } = await searchParams;
  const taskId = idSchema.safeParse(task).success ? (task as string) : null;
  return <FocusTimerClient initialTaskId={taskId} />;
}

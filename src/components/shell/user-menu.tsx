"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { AsciiSpinner } from "@/components/ascii/ascii-spinner";
import { signOut } from "@/lib/auth-client";
import { clearLocalUserData } from "@/lib/local-data";

import { OnlineBadge } from "./online-badge";

export function UserMenu({ user }: { user: { name: string; email: string } }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [pending, start] = useTransition();

  const onSignOut = () =>
    start(async () => {
      await signOut();
      qc.clear();
      await clearLocalUserData();
      router.replace("/");
      router.refresh();
    });

  return (
    <div className="border-t-2 border-dashed border-line pt-3">
      <OnlineBadge />
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-bold">@{user.name}</p>
          <p className="truncate text-xs text-muted">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          disabled={pending}
          className="term text-lg text-fg-dim hover:text-danger"
        >
          {pending ? <AsciiSpinner /> : "[EXIT]"}
        </button>
      </div>
    </div>
  );
}

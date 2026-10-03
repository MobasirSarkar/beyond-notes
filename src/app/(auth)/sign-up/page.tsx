import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { formatAuthError } from "@/lib/utils/auth-error";
import { AuthForm } from "@/components/features/auth/auth-form";
import { env } from "@/env";
import { getSession } from "@/server/session";

export const metadata: Metadata = { title: "Create account" };

export default async function SignUpPage({ searchParams }: PageProps<"/sign-up">) {
  const { error } = await searchParams;
  if (await getSession()) redirect("/boards");
  return (
    <AuthForm
      mode="sign-up"
      next="/boards"
      github={Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET)}
      initialError={formatAuthError(error) ?? undefined}
    />
  );
}

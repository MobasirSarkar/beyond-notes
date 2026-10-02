import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/features/auth/auth-form";
import { env } from "@/env";
import { isAppRoute, safeRedirectPath } from "@/lib/utils/safe-redirect";
import { getSession } from "@/server/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const { next } = await searchParams;
  const target = safeRedirectPath(next);
  if (await getSession()) redirect(isAppRoute(target) ? target : "/boards");
  return (
    <AuthForm
      mode="sign-in"
      next={target}
      github={Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET)}
    />
  );
}

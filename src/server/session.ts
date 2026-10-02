import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "./auth";

/** Session for the current request, memoised per render pass. */
export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

/** Use in Server Components / layouts: redirects anonymous users to sign-in. */
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session.user;
}

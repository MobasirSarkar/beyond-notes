import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { FeatureList } from "@/components/features/landing/feature-list";
import { Hero } from "@/components/features/landing/hero";
import { CosmosBackdrop } from "@/components/ui/cosmos-backdrop";
import { buttonStyles } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Kbd } from "@/components/ui/kbd";
import { Rule } from "@/components/ui/rule";
import { getSession } from "@/server/session";

const KEYS = [
  ["⌘K", "command palette"],
  ["t", "capture a task"],
  ["v", "capture by voice"],
  ["n", "new note"],
  ["1–6", "switch window"],
  ["?", "all shortcuts"],
] as const;

export default async function LandingPage() {
  const session = await getSession();
  return (
    <>
      <CosmosBackdrop variant="hero" />
      <header>
        <div className="page flex h-(--header-h) items-center justify-between">
          <span className="heading text-lg">beyond</span>
          <Link
            href={session ? "/boards" : "/sign-in"}
            className={buttonStyles({ size: "sm", variant: "outline" })}
          >
            {session ? "open workspace" : "sign in"}
            {session ? <Icon icon={ArrowRight} className="size-3.5" /> : null}
          </Link>
        </div>
      </header>
      <main id="main">
        <Hero signedIn={session !== null} />
        <section className="page flex flex-col gap-8 py-(--section-gap)">
          <Rule>what&apos;s inside</Rule>
          <FeatureList />
        </section>
        <section className="page flex flex-col gap-8 pb-(--section-gap)">
          <Rule>keyboard first</Rule>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {KEYS.map(([k, d]) => (
              <li
                key={k}
                className="flex items-center gap-3 rounded-full glass py-2 pr-4 pl-2 text-sm shadow-none"
              >
                <Kbd className="min-w-10">{k}</Kbd>
                <span className="text-muted">{d}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <footer>
        <div className="page flex flex-wrap justify-between gap-2 py-8 text-xs text-subtle">
          <span>beyond · a calm orbit for your work</span>
          <span>offline · installable · keyboard first</span>
        </div>
      </footer>
    </>
  );
}

"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useId, useState, useTransition, type FormEvent } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { signIn, signUp } from "@/lib/auth/client";

const signInSchema = z.object({
  email: z.email("Enter a valid email address.").max(254),
  password: z.string().min(1, "Enter your password.").max(128),
});
const signUpSchema = signInSchema.extend({
  name: z.string().trim().min(1, "Enter your name.").max(60),
  password: z
    .string()
    .min(10, "Use at least 10 characters.")
    .max(128)
    .regex(/[a-z]/i, "Include at least one letter.")
    .regex(/\d|[^a-z0-9]/i, "Include a number or symbol."),
});

type Props = {
  mode: "sign-in" | "sign-up";
  next: string;
  github: boolean;
  initialError?: string | undefined;
};

export function AuthForm({ mode, next, github, initialError }: Props) {
  const ids = useId();
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [pending, startTransition] = useTransition();
  const isSignUp = mode === "sign-up";

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    startTransition(async () => {
      let failure: { status: number; message?: string | undefined } | null = null;
      if (isSignUp) {
        const parsed = signUpSchema.safeParse(data);
        if (!parsed.success)
          return setError(parsed.error.issues[0]?.message ?? "Check the highlighted fields.");
        const res = await signUp.email(parsed.data);
        if (res.error) failure = { status: res.error.status, message: res.error.message };
      } else {
        const parsed = signInSchema.safeParse(data);
        if (!parsed.success)
          return setError(parsed.error.issues[0]?.message ?? "Check the highlighted fields.");
        const res = await signIn.email(parsed.data);
        if (res.error) failure = { status: res.error.status };
      }
      if (failure) {
        // Generic sign-in message: never reveal whether an account exists.
        setError(
          failure.status === 429
            ? "Too many attempts. Wait a minute and try again."
            : isSignUp
              ? (failure.message ?? "Could not create the account.")
              : "Incorrect email or password.",
        );
        return;
      }
      // Full navigation so the new session cookie drives a fresh server render.
      window.location.assign(next);
    });
  }

  function onSocialSignIn() {
    setError(null);
    startTransition(async () => {
      try {
        await signIn.social({ provider: "github", callbackURL: next });
      } catch (err) {
        setError(err instanceof Error ? err.message : "GitHub authentication failed.");
      }
    });
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-panel glass-strong">
      <header className="flex flex-col gap-1 px-6 py-6 rule-b sm:px-8">
        <p className="type-overline">{isSignUp ? "Get started" : "Sign in"}</p>
        <h1 className="type-heading">{isSignUp ? "Create your account" : "Welcome back"}</h1>
      </header>
      <form onSubmit={onSubmit} className="flex flex-col gap-5 px-6 py-6 sm:px-8" noValidate>
        {isSignUp ? (
          <Field label="Name" htmlFor={`${ids}-name`}>
            <Input id={`${ids}-name`} name="name" autoComplete="username" maxLength={60} required />
          </Field>
        ) : null}
        <Field label="Email" htmlFor={`${ids}-email`}>
          <Input
            id={`${ids}-email`}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            maxLength={254}
            required
          />
        </Field>
        <Field
          label="Password"
          htmlFor={`${ids}-password`}
          hint={isSignUp ? "At least 10 characters, including a number or symbol." : undefined}
        >
          <Input
            id={`${ids}-password`}
            name="password"
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            minLength={isSignUp ? 10 : 1}
            maxLength={128}
            required
          />
        </Field>

        <AnimatePresence>
          {error ? (
            <motion.p
              role="alert"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: [0, -4, 4, -2, 2, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-control rule-strong lift px-3 py-2 text-sm"
            >
              {error}
            </motion.p>
          ) : null}
        </AnimatePresence>

        <Button type="submit" variant="solid" size="lg" disabled={pending}>
          {pending ? <Spinner label="Working" /> : null}
          {isSignUp ? "Create account" : "Sign in"}
        </Button>

        {github ? (
          <>
            <div className="flex items-center gap-3" role="separator">
              <span aria-hidden className="flex-1 rule-t" />
              <span className="text-xs uppercase tracking-wider text-muted">or</span>
              <span aria-hidden className="flex-1 rule-t" />
            </div>
            <Button
              type="button"
              size="lg"
              disabled={pending}
              onClick={onSocialSignIn}
            >
              {pending ? <Spinner label="Redirecting to GitHub" /> : null}
              Continue with GitHub
            </Button>
          </>
        ) : null}
      </form>
      <footer className="px-6 py-4 text-center text-sm text-muted rule-t sm:px-8">
        {isSignUp ? (
          <>
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="text-fg underline decoration-dotted underline-offset-4"
            >
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link
              href="/sign-up"
              className="text-fg underline decoration-dotted underline-offset-4"
            >
              Create an account
            </Link>
          </>
        )}
      </footer>
    </div>
  );
}

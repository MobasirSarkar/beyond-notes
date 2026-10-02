"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { z } from "zod";

import { Panel } from "@/components/ascii/panel";
import { PixelButton } from "@/components/ascii/pixel-button";
import { ScrambleText } from "@/components/ascii/scramble-text";
import { AsciiSpinner } from "@/components/ascii/ascii-spinner";
import { signIn, signUp } from "@/lib/auth-client";

const signInSchema = z.object({
  email: z.email("Enter a valid email").max(254),
  password: z.string().min(1, "Password required").max(128),
});
const signUpSchema = signInSchema.extend({
  name: z.string().trim().min(1, "Name required").max(60),
  password: z
    .string()
    .min(10, "At least 10 characters")
    .max(128)
    .regex(/[a-z]/i, "Include a letter")
    .regex(/\d|[^a-z0-9]/i, "Include a number or symbol"),
});

type Props = { mode: "sign-in" | "sign-up"; next: string; github: boolean };

export function AuthForm({ mode, next, github }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isSignUp = mode === "sign-up";

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = (isSignUp ? signUpSchema : signInSchema).safeParse(data);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    startTransition(async () => {
      const res = isSignUp
        ? await signUp.email({
            email: parsed.data.email,
            password: parsed.data.password,
            name: "name" in parsed.data ? String(parsed.data.name) : "",
          })
        : await signIn.email({ email: parsed.data.email, password: parsed.data.password });
      if (res.error) {
        // Generic message: never reveal whether an account exists.
        setError(
          res.error.status === 429
            ? "Too many attempts. Wait a minute and try again."
            : isSignUp
              ? (res.error.message ?? "Could not create account")
              : "Invalid email or password",
        );
        return;
      }
      router.replace(next as "/boards");
      router.refresh();
    });
  }

  return (
    <Panel title={<ScrambleText text={isSignUp ? "NEW PLAYER" : "LOGIN"} />}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {isSignUp ? (
          <label className="term flex flex-col gap-1 text-lg">
            <span>&gt; handle</span>
            <input
              name="name"
              autoComplete="username"
              className="px-input"
              maxLength={60}
              required
            />
          </label>
        ) : null}
        <label className="term flex flex-col gap-1 text-lg">
          <span>&gt; email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            className="px-input"
            maxLength={254}
            required
          />
        </label>
        <label className="term flex flex-col gap-1 text-lg">
          <span>&gt; password</span>
          <input
            name="password"
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            className="px-input"
            minLength={isSignUp ? 10 : 1}
            maxLength={128}
            required
          />
        </label>

        <AnimatePresence>
          {error ? (
            <motion.p
              role="alert"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: [0, -6, 6, -3, 3, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="term border-2 border-danger px-3 py-1 text-lg text-danger"
            >
              ! {error}
            </motion.p>
          ) : null}
        </AnimatePresence>

        <PixelButton type="submit" variant="primary" disabled={pending} className="text-2xl">
          {pending ? <AsciiSpinner /> : null}
          {isSignUp ? "[ CREATE ACCOUNT ]" : "[ ENTER ]"}
        </PixelButton>

        {github ? (
          <PixelButton
            onClick={() => void signIn.social({ provider: "github", callbackURL: next })}
            disabled={pending}
          >
            [ CONTINUE WITH GITHUB ]
          </PixelButton>
        ) : null}

        <p className="term text-center text-lg text-fg-dim">
          {isSignUp ? (
            <>
              have an account?{" "}
              <Link href="/sign-in" className="text-accent underline">
                sign in
              </Link>
            </>
          ) : (
            <>
              new here?{" "}
              <Link href="/sign-up" className="text-accent underline">
                create an account
              </Link>
            </>
          )}
        </p>
      </form>
    </Panel>
  );
}

"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Badge, Button, Card, Input } from "@/components/ui";
import { isDevAnyEmailDomainEnabled, isDevQuickLoginEnabled } from "@/lib/dev-preview";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";

const BUTLER_DOMAIN = "@butler.edu";

function isButlerEmail(email: string) {
  return email.trim().toLowerCase().endsWith(BUTLER_DOMAIN);
}

function LogoMark() {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-white shadow-[0_10px_24px_rgba(0,57,166,0.18)]">
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
        <path
          d="M5 9.2h14l-1.2 7a1.7 1.7 0 0 1-1.7 1.4H7.9a1.7 1.7 0 0 1-1.7-1.4L5 9.2Z"
          fill="currentColor"
          opacity=".95"
        />
        <path
          d="M8.6 9.2V8a3.4 3.4 0 0 1 6.8 0v1.2"
          stroke="white"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

type LoginClientProps = {
  callbackError?: string | null;
  mode?: "login" | "signup";
  nextPath?: string | null;
};

function normalizeNextPath(nextPath?: string | null) {
  if (!nextPath || typeof nextPath !== "string") {
    return null;
  }
  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return null;
  }
  if (nextPath.startsWith("/login") || nextPath.startsWith("/signup")) {
    return null;
  }
  return nextPath;
}

export function LoginClient({ callbackError, mode = "login", nextPath }: LoginClientProps) {
  const router = useRouter();
  const allowAnyEmailDomain = isDevAnyEmailDomainEnabled();
  const quickLoginEnabled = isDevQuickLoginEnabled();
  const normalizedNextPath = normalizeNextPath(nextPath);
  const switchAuthHref = (() => {
    const base = mode === "signup" ? "/login" : "/signup";
    if (!normalizedNextPath) {
      return base;
    }
    return `${base}?next=${encodeURIComponent(normalizedNextPath)}`;
  })();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [domainError, setDomainError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    setDomainError(null);
    setSubmitError(null);

    if (!allowAnyEmailDomain && !isButlerEmail(normalizedEmail)) {
      setDomainError("SideSpark is for Butler students only.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createSupabaseClient();
      const callbackUrl = new URL("/callback", window.location.origin);
      if (normalizedNextPath) {
        callbackUrl.searchParams.set("next", normalizedNextPath);
      }
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: callbackUrl.toString()
        }
      });

      if (error) {
        setSubmitError(error.message);
        return;
      }

      const verifyUrl = new URL("/verify", window.location.origin);
      verifyUrl.searchParams.set("email", normalizedEmail);
      if (normalizedNextPath) {
        verifyUrl.searchParams.set("next", normalizedNextPath);
      }
      router.push(`${verifyUrl.pathname}${verifyUrl.search}`);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to send sign-in email."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-5 pt-2">
      <section className="space-y-3">
        <LogoMark />
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
              {mode === "signup" ? "Create your SideSpark account" : "SideSpark"}
            </h1>
            <Badge variant={allowAnyEmailDomain ? "warning" : "info"}>
              {allowAnyEmailDomain ? "Dev: any email" : "Butler only"}
            </Badge>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {allowAnyEmailDomain
              ? "Dev mode: any email can request a sign-in link."
              : mode === "signup"
                ? "Sign up with your Butler email to start buying, selling, and collaborating."
                : "Buy, sell, and book with verified Butler students."}
          </p>
        </div>
      </section>

      <Card className="space-y-4">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            type="email"
            label={allowAnyEmailDomain ? "Email" : "Butler email"}
            placeholder={allowAnyEmailDomain ? "you@example.com" : "you@butler.edu"}
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            inputMode="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (domainError) {
                setDomainError(null);
              }
              if (submitError) {
                setSubmitError(null);
              }
            }}
            error={domainError ?? undefined}
            helperText={
              allowAnyEmailDomain
                ? "Dev mode: we’ll send a sign-in link to this email."
                : "We’ll send a secure sign-in link to your Butler inbox."
            }
            required
          />

          {callbackError ? (
            <p className="text-sm text-[var(--color-accent)]">{callbackError}</p>
          ) : null}
          {submitError ? <p className="text-sm text-[var(--color-accent)]">{submitError}</p> : null}

          <Button type="submit" loading={loading}>
            Continue
          </Button>

          <p className="text-center text-sm text-[var(--color-text-secondary)]">
            {mode === "signup" ? "Already have an account?" : "Need an account?"}{" "}
            <Link className="font-medium text-[var(--color-primary)]" href={switchAuthHref}>
              {mode === "signup" ? "Log in" : "Sign up"}
            </Link>
          </p>

          {quickLoginEnabled ? (
            <p className="text-center text-xs text-[var(--color-text-secondary)]">
              Dev helper:{" "}
              <Link
                className="font-medium text-[var(--color-primary)]"
                href={
                  normalizedNextPath
                    ? `/dev/quick-login?next=${encodeURIComponent(normalizedNextPath)}`
                    : "/dev/quick-login"
                }
              >
                Quick login as test user
              </Link>
            </p>
          ) : null}
        </form>
      </Card>
    </div>
  );
}

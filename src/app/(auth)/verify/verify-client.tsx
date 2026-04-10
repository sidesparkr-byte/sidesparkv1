"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Button, Card } from "@/components/ui";
import { isDevAnyEmailDomainEnabled } from "@/lib/dev-preview";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";

const INITIAL_COOLDOWN = 60;

function isButlerEmail(email: string) {
  return email.trim().toLowerCase().endsWith("@butler.edu");
}

type VerifyClientProps = {
  email?: string;
  nextPath?: string;
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

export function VerifyClient({ email = "", nextPath }: VerifyClientProps) {
  const allowAnyEmailDomain = isDevAnyEmailDomainEnabled();
  const normalizedNextPath = normalizeNextPath(nextPath);
  const [cooldown, setCooldown] = useState(INITIAL_COOLDOWN);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCooldown(INITIAL_COOLDOWN);
  }, [email]);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCooldown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldown]);

  async function handleResend() {
    setError(null);
    setStatus(null);

    if (!email || (!allowAnyEmailDomain && !isButlerEmail(email))) {
      setError(
        allowAnyEmailDomain
          ? "Enter a valid email on the login screen first."
          : "Enter a valid Butler email on the login screen first."
      );
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseClient();
      const callbackUrl = new URL("/callback", window.location.origin);
      if (normalizedNextPath) {
        callbackUrl.searchParams.set("next", normalizedNextPath);
      }
      const { error: resendError } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase(),
        options: {
          emailRedirectTo: callbackUrl.toString()
        }
      });

      if (resendError) {
        setError(resendError.message);
        return;
      }

      setStatus("A new sign-in link was sent.");
      setCooldown(INITIAL_COOLDOWN);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to resend email.");
    } finally {
      setLoading(false);
    }
  }

  const changeEmailHref = normalizedNextPath
    ? `/login?next=${encodeURIComponent(normalizedNextPath)}`
    : "/login";

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-5 pt-2">
      <Card className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            {allowAnyEmailDomain ? "Check your email" : "Check your Butler email"}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {email && (allowAnyEmailDomain || isButlerEmail(email)) ? (
              <>
                We sent a link to <span className="font-medium text-[var(--color-text-primary)]">{email}</span>.
              </>
            ) : (
              allowAnyEmailDomain
                ? "We sent a sign-in link to your email."
                : "We sent a sign-in link to your Butler email."
            )}
          </p>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Open the email on this device and tap the link to continue.
          </p>
        </div>

        {error ? <p className="text-sm text-[var(--color-accent)]">{error}</p> : null}
        {status ? <p className="text-sm text-[var(--color-success)]">{status}</p> : null}

        <Button
          variant="secondary"
          onClick={handleResend}
          disabled={cooldown > 0 || loading}
          loading={loading}
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
        </Button>

        <Link
          href={changeEmailHref}
          className="block text-center text-sm font-medium text-[var(--color-primary)]"
        >
          Change email
        </Link>
      </Card>
    </div>
  );
}

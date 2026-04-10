import { notFound } from "next/navigation";
import Link from "next/link";

import { Button, Card, Input } from "@/components/ui";
import { isDevQuickLoginEnabled } from "@/lib/dev-preview";

const SUGGESTED_TEST_EMAILS = [
  "test.buyer1@butler.edu",
  "test.buyer2@butler.edu",
  "test.seller1@butler.edu",
  "test.seller2@butler.edu",
  "test.tutor@butler.edu",
  "test.service@butler.edu"
];

function normalizeNextPath(nextPath?: string | null) {
  if (!nextPath || typeof nextPath !== "string") {
    return null;
  }
  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return null;
  }
  return nextPath;
}

function errorMessage(code?: string) {
  switch (code) {
    case "email_required":
      return "Enter a valid email to continue.";
    case "email_not_allowed":
      return "That email is not allowed by DEV_QUICK_LOGIN_EMAILS.";
    case "link_failed":
      return "Unable to generate quick-login link. Check Supabase auth config.";
    case "server_error":
      return "Quick login failed due to a server error.";
    default:
      return null;
  }
}

export default function DevQuickLoginPage({
  searchParams
}: {
  searchParams?: { error?: string; email?: string; next?: string };
}) {
  if (!isDevQuickLoginEnabled()) {
    notFound();
  }

  const message = errorMessage(searchParams?.error);
  const nextPath = normalizeNextPath(searchParams?.next ?? null);
  const initialEmail = (searchParams?.email ?? "").trim().toLowerCase();

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-4 pt-3">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
          Dev Quick Login
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Local-only helper to switch between test users without waiting for email links.
        </p>
      </section>

      <Card className="space-y-3 border-[color:rgba(255,107,53,0.24)] bg-[color:rgba(255,107,53,0.10)]">
        <p className="text-sm font-medium text-[var(--color-accent)]">Development only</p>
        <p className="text-xs text-[var(--color-text-secondary)]">
          This route should never be enabled in production. Keep <code>DEV_QUICK_LOGIN</code>{" "}
          local-only.
        </p>
      </Card>

      <Card className="space-y-4">
        <form action="/dev/quick-login/start" method="get" className="space-y-3">
          <Input
            type="email"
            name="email"
            label="Email"
            placeholder="test.buyer1@butler.edu"
            defaultValue={initialEmail}
            required
          />
          {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
          {message ? <p className="text-sm text-[var(--color-accent)]">{message}</p> : null}
          <Button type="submit">Sign in as this user</Button>
        </form>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            Suggested test users
          </p>
          <div className="space-y-2">
            {SUGGESTED_TEST_EMAILS.map((email) => {
              const href = nextPath
                ? `/dev/quick-login/start?email=${encodeURIComponent(email)}&next=${encodeURIComponent(nextPath)}`
                : `/dev/quick-login/start?email=${encodeURIComponent(email)}`;
              return (
                <Link
                  key={email}
                  href={href}
                  className="inline-flex min-h-11 w-full items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-text-secondary)] shadow-[0_8px_20px_rgba(26,26,26,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(26,26,26,0.06)]"
                >
                  <span className="truncate">{email}</span>
                  <span className="ml-3 shrink-0 text-xs font-medium text-[var(--color-primary)]">
                    Use
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </Card>

      <Link href="/login" className="text-center text-sm font-medium text-[var(--color-primary)]">
        Back to regular login
      </Link>
    </div>
  );
}

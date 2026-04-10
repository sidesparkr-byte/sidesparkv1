"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button, useToast } from "@/components/ui";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type SignOutButtonProps = {
  mode?: "default" | "row";
  className?: string;
};

export function SignOutButton({
  mode = "default",
  className
}: SignOutButtonProps = {}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        showToast(error.message, { variant: "error", title: "Logout failed" });
        return;
      }

      router.replace("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (mode === "row") {
    return (
      <button
        type="button"
        onClick={handleSignOut}
        disabled={loading}
        className={cn(
          "flex min-h-[52px] w-full items-center justify-between gap-3 border-b border-[var(--color-border)] px-1 py-3 text-left transition disabled:opacity-60",
          className
        )}
      >
        <span className="text-base font-medium text-[var(--color-text-primary)]">
          {loading ? "Signing Out..." : "Sign Out"}
        </span>
        <svg
          viewBox="0 0 20 20"
          className="h-4 w-4 text-[var(--color-text-muted)]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path d="M7 4.5 12.5 10 7 15.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    );
  }

  return (
    <Button
      variant="danger"
      loading={loading}
      onClick={handleSignOut}
      className={className}
    >
      Log out
    </Button>
  );
}

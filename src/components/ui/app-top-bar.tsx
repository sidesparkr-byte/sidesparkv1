"use client";

import { usePathname } from "next/navigation";

import { FeedbackButton } from "@/components/ui/feedback-button";

export function AppTopBar() {
  const pathname = usePathname();

  if (pathname === "/feed" || pathname === "/scan" || pathname.startsWith("/rate/")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-[var(--color-border)] bg-[color:rgba(255,255,255,0.95)] pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-[color:rgba(255,255,255,0.82)]">
      <div className="relative flex h-14 items-center px-4">
        <span className="text-lg font-semibold tracking-tight text-[var(--color-text-primary)]">
          SideSpark
        </span>
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <FeedbackButton />
        </div>
      </div>
    </header>
  );
}

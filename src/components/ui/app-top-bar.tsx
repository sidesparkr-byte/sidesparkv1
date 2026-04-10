"use client";

import { usePathname } from "next/navigation";

export function AppTopBar() {
  const pathname = usePathname();

  if (pathname === "/feed" || pathname === "/scan" || pathname.startsWith("/rate/")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-[var(--color-border)] bg-[color:rgba(255,255,255,0.95)] pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-[color:rgba(255,255,255,0.82)]">
      <div className="flex h-14 items-center px-4">
        <span className="text-lg font-semibold tracking-tight text-[var(--color-text-primary)]">
          SideSpark
        </span>
      </div>
    </header>
  );
}

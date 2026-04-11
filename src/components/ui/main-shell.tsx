"use client";

import { usePathname } from "next/navigation";

import { BottomNav } from "@/components/ui/bottom-nav";
import { cn } from "@/lib/utils";

export function MainShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullscreenRoute = pathname === "/scan" || pathname.startsWith("/rate/");

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[var(--color-surface)]">
      <main
        id="main-shell-scroll"
        className={cn(
          "app-scroll flex-1 overflow-x-hidden overflow-y-auto overscroll-contain",
          isFullscreenRoute
            ? "bg-black"
            : "bg-[linear-gradient(180deg,rgba(255,255,255,0.52)_0%,rgba(245,245,245,0.96)_18%,rgba(245,245,245,1)_100%)] px-4 pb-[calc(env(safe-area-inset-bottom)+100px)] pt-3"
        )}
      >
        {children}
      </main>
      {!isFullscreenRoute ? <BottomNav /> : null}
    </div>
  );
}

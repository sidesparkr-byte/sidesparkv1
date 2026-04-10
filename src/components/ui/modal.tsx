"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  showHandle?: boolean;
  closeOnBackdrop?: boolean;
};

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  showHandle = true,
  closeOnBackdrop = true
}: ModalProps) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
      const frame = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }

    setVisible(false);
    closeTimerRef.current = window.setTimeout(() => {
      setMounted(false);
    }, 220);

    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, [open]);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mounted, onClose]);

  if (!mounted) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-end justify-center",
        visible ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close modal"
        className={cn(
          "absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity duration-200",
          visible ? "opacity-100" : "opacity-0"
        )}
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : "Modal"}
        className={cn(
          "relative z-10 w-full max-w-[430px] rounded-t-3xl bg-[var(--color-background)] px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3 shadow-2xl",
          "max-h-[85dvh] overflow-hidden transition-transform duration-200 ease-out",
          visible ? "translate-y-0" : "translate-y-full",
          className
        )}
        onClick={(event) => event.stopPropagation()}
      >
        {showHandle ? (
          <div className="mb-3 flex justify-center">
            <div className="h-1.5 w-12 rounded-full bg-[var(--color-border)]" />
          </div>
        ) : null}

        {title ? (
          <div className="mb-3">
            <h2 className="text-base font-semibold tracking-tight text-[var(--color-text-primary)]">
              {title}
            </h2>
          </div>
        ) : null}

        <div className="app-scroll overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}

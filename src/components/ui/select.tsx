import { useId } from "react";

import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: React.ReactNode | boolean;
  containerClassName?: string;
};

export function Select({
  id,
  label,
  helperText,
  error,
  className,
  containerClassName,
  children,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const errorText = typeof error === "string" ? error : null;
  const helperId = helperText ? `${selectId}-helper` : undefined;
  const errorId = errorText ? `${selectId}-error` : undefined;
  const hasError = Boolean(error);

  return (
    <div className={cn("space-y-1.5", containerClassName)}>
      {label ? (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-[var(--color-text-secondary)]"
        >
          {label}
        </label>
      ) : null}

      <div className="relative">
        <select
          id={selectId}
          aria-invalid={hasError || undefined}
          aria-describedby={[errorId, helperId].filter(Boolean).join(" ") || undefined}
          className={cn(
            "h-12 w-full appearance-none rounded-xl border bg-[var(--color-background)] px-3 pr-10 text-base text-[var(--color-text-primary)] outline-none",
            "focus:ring-2 focus:ring-[var(--color-primary)]/10",
            hasError
              ? "border-[var(--color-accent)] focus:border-[var(--color-accent)] focus:ring-[var(--color-accent)]/10"
              : "border-[var(--color-border)] focus:border-[var(--color-primary)]",
            className
          )}
          {...props}
        >
          {children}
        </select>

        <svg
          viewBox="0 0 20 20"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path d="m5.5 7.5 4.5 4.5 4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {errorText ? (
        <p id={errorId} className="text-xs text-[var(--color-accent)]">
          {errorText}
        </p>
      ) : helperText ? (
        <p
          id={helperId}
          className={cn(
            "text-xs",
            hasError ? "text-[var(--color-accent)]" : "text-[var(--color-text-secondary)]"
          )}
        >
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

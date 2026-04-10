import { useId } from "react";

import { cn } from "@/lib/utils";

type InputType =
  | "text"
  | "email"
  | "number"
  | "password"
  | "search"
  | "date";

export type InputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  type?: InputType;
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: React.ReactNode | boolean;
  inputClassName?: string;
  containerClassName?: string;
};

function inputBaseClasses(hasError: boolean) {
  return cn(
    "h-12 w-full rounded-xl border bg-[var(--color-background)] px-3 text-base text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]",
    "focus:ring-2 focus:ring-[var(--color-primary)]/10",
    hasError
      ? "border-[var(--color-accent)] focus:border-[var(--color-accent)] focus:ring-[var(--color-accent)]/10"
      : "border-[var(--color-border)] focus:border-[var(--color-primary)]"
  );
}

export function Input({
  id,
  label,
  helperText,
  error,
  className,
  inputClassName,
  containerClassName,
  type = "text",
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = helperText ? `${inputId}-helper` : undefined;
  const errorText = typeof error === "string" ? error : null;
  const errorId = errorText ? `${inputId}-error` : undefined;
  const hasError = Boolean(error);

  return (
    <div className={cn("space-y-1.5", containerClassName, className)}>
      {label ? (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-[var(--color-text-secondary)]"
        >
          {label}
        </label>
      ) : null}

      <input
        id={inputId}
        type={type}
        aria-invalid={hasError || undefined}
        aria-describedby={[errorId, helperId].filter(Boolean).join(" ") || undefined}
        className={cn(inputBaseClasses(hasError), inputClassName)}
        {...props}
      />

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

export { inputBaseClasses };

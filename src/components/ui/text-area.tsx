"use client";

import { useEffect, useId, useState } from "react";

import { cn } from "@/lib/utils";

export type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: React.ReactNode | boolean;
  showCharacterCount?: boolean;
  containerClassName?: string;
};

export function TextArea({
  id,
  label,
  helperText,
  error,
  className,
  rows = 4,
  value,
  defaultValue,
  onChange,
  showCharacterCount = true,
  containerClassName,
  ...props
}: TextAreaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const errorText = typeof error === "string" ? error : null;
  const helperId = helperText ? `${textareaId}-helper` : undefined;
  const errorId = errorText ? `${textareaId}-error` : undefined;
  const hasError = Boolean(error);

  const [count, setCount] = useState(() => {
    const source = value ?? defaultValue;
    return typeof source === "string" ? source.length : 0;
  });

  useEffect(() => {
    if (typeof value === "string") {
      setCount(value.length);
    }
  }, [value]);

  return (
    <div className={cn("space-y-1.5", containerClassName)}>
      {label ? (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-[var(--color-text-secondary)]"
        >
          {label}
        </label>
      ) : null}

      <textarea
        id={textareaId}
        rows={rows}
        value={value}
        defaultValue={defaultValue}
        onChange={(event) => {
          if (value === undefined) {
            setCount(event.target.value.length);
          } else {
            setCount(event.target.value.length);
          }
          onChange?.(event);
        }}
        aria-invalid={hasError || undefined}
        aria-describedby={[errorId, helperId].filter(Boolean).join(" ") || undefined}
        className={cn(
          "w-full rounded-xl border bg-[var(--color-background)] px-3 py-3 text-base text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]",
          "focus:ring-2 focus:ring-[var(--color-primary)]/10",
          hasError
            ? "border-[var(--color-accent)] focus:border-[var(--color-accent)] focus:ring-[var(--color-accent)]/10"
            : "border-[var(--color-border)] focus:border-[var(--color-primary)]",
          className
        )}
        {...props}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-h-4">
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

        {showCharacterCount ? (
          <p className="shrink-0 text-xs text-[var(--color-text-muted)]">
            {count}
            {typeof props.maxLength === "number" ? `/${props.maxLength}` : ""}
          </p>
        ) : null}
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";

export type BadgeVariant = "success" | "warning" | "info" | "neutral";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const badgeVariants: Record<BadgeVariant, string> = {
  success:
    "bg-[color:rgba(45,155,111,0.12)] text-[var(--color-success)] ring-1 ring-[color:rgba(45,155,111,0.18)]",
  warning:
    "bg-[color:rgba(255,107,53,0.12)] text-[var(--color-accent)] ring-1 ring-[color:rgba(255,107,53,0.18)]",
  info:
    "bg-[color:rgba(0,57,166,0.10)] text-[var(--color-primary)] ring-1 ring-[color:rgba(0,57,166,0.14)]",
  neutral:
    "bg-[var(--color-surface)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]"
};

export function Badge({
  className,
  variant = "neutral",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium leading-none",
        badgeVariants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

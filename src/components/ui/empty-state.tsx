import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type EmptyStateProps = {
  icon: React.ReactNode;
  title: React.ReactNode;
  subtitle: React.ReactNode;
  ctaLabel?: string;
  onCtaClick?: () => void;
  ctaProps?: Omit<ButtonProps, "children" | "onClick">;
  className?: string;
};

export function EmptyState({
  icon,
  title,
  subtitle,
  ctaLabel,
  onCtaClick,
  ctaProps,
  className
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-background)] px-6 py-8 text-center shadow-[0_8px_24px_rgba(26,26,26,0.04)]",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface)] text-[var(--color-text-secondary)]">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold tracking-tight text-[var(--color-text-primary)]">
        {title}
      </h3>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{subtitle}</p>

      {ctaLabel ? (
        <div className="mt-4 w-full max-w-xs">
          <Button onClick={onCtaClick} fullWidthMobile variant="primary" {...ctaProps}>
            {ctaLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

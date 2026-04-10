import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PlaceholderCardProps = {
  title: string;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
};

export function PlaceholderCard({
  title,
  subtitle,
  className,
  children
}: PlaceholderCardProps) {
  return (
    <Card className={cn("rounded-2xl", className)}>
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h2>
        {subtitle ? (
          <p className="text-sm text-[var(--color-text-secondary)]">{subtitle}</p>
        ) : null}
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </Card>
  );
}

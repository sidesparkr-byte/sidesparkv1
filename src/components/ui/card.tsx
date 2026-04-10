import { cn } from "@/lib/utils";

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  onClick?: React.MouseEventHandler<HTMLDivElement>;
};

export function Card({ className, onClick, children, ...props }: CardProps) {
  const clickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      onKeyDown={
        clickable
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick?.(event as unknown as React.MouseEvent<HTMLDivElement>);
              }
            }
          : undefined
      }
      role={clickable ? "button" : props.role}
      tabIndex={clickable ? 0 : props.tabIndex}
      className={cn(
        "rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[0_8px_24px_rgba(26,26,26,0.05)]",
        clickable &&
          "cursor-pointer transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(26,26,26,0.08)] active:scale-[0.995] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/25",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

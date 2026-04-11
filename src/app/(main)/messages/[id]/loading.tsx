function SkeletonBubble({
  align,
  height,
  width
}: {
  align: "left" | "right";
  height: string;
  width: string;
}) {
  return (
    <div className={align === "right" ? "flex justify-end" : "flex justify-start"}>
      <div className={`skeleton-shimmer rounded-full ${height} ${width}`} />
    </div>
  );
}

export default function MessageThreadLoading() {
  return (
    <div className="-mx-4 -mt-3 flex min-h-[calc(100dvh-56px-60px-env(safe-area-inset-bottom)-12px)] flex-col overflow-x-hidden bg-white">
      <div className="border-b border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="skeleton-shimmer h-11 w-11 rounded-xl" />
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="skeleton-shimmer h-12 w-14 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="skeleton-shimmer h-4 w-3/4 rounded-full" />
              <div className="skeleton-shimmer h-3 w-1/2 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="app-scroll flex-1 space-y-4 overflow-x-hidden overflow-y-auto bg-white px-4 py-5">
        <SkeletonBubble align="left" height="h-9" width="w-[68%]" />
        <SkeletonBubble align="right" height="h-12" width="w-[76%]" />
        <SkeletonBubble align="left" height="h-9" width="w-[54%]" />
      </div>

      <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+76px)] z-20 border-t border-[var(--color-border)] bg-[var(--color-background)] px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-2">
        <div className="mb-2 flex gap-2 overflow-hidden pb-1">
          <div className="skeleton-shimmer h-11 w-36 shrink-0 rounded-full" />
          <div className="skeleton-shimmer h-11 w-44 shrink-0 rounded-full" />
        </div>
        <div className="flex items-end gap-2">
          <div className="skeleton-shimmer h-12 flex-1 rounded-xl" />
          <div className="skeleton-shimmer h-12 w-16 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

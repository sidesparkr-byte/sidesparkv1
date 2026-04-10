function DetailSkeletonRow({ className = "" }: { className?: string }) {
  return <div className={`skeleton-shimmer rounded-xl ${className}`.trim()} />;
}

export default function ListingDetailLoading() {
  return (
    <div className="space-y-5 overflow-x-hidden pb-[calc(132px+env(safe-area-inset-bottom))]">
      <div className="-mx-4 overflow-hidden bg-[var(--color-background)]">
        <div className="skeleton-shimmer aspect-[4/3] w-full" />
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <DetailSkeletonRow className="h-6 w-20 rounded-full" />
          <DetailSkeletonRow className="h-4 w-24" />
        </div>
        <div className="space-y-2">
          <DetailSkeletonRow className="h-8 w-4/5" />
          <DetailSkeletonRow className="h-8 w-32" />
        </div>
        <div className="h-px w-full bg-[var(--color-border)]" />
        <div className="flex gap-3 overflow-hidden">
          <DetailSkeletonRow className="h-[60px] flex-1 rounded-2xl" />
          <DetailSkeletonRow className="h-[60px] flex-1 rounded-2xl" />
        </div>
      </section>

      <section className="rounded-2xl bg-[var(--color-surface)] p-4">
        <div className="flex items-start gap-3">
          <DetailSkeletonRow className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2.5">
            <DetailSkeletonRow className="h-4 w-28" />
            <DetailSkeletonRow className="h-10 w-full" />
            <DetailSkeletonRow className="h-10 w-full" />
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <DetailSkeletonRow className="h-4 w-24" />
        <DetailSkeletonRow className="h-4 w-full" />
        <DetailSkeletonRow className="h-4 w-[92%]" />
        <DetailSkeletonRow className="h-4 w-3/4" />
      </section>
    </div>
  );
}

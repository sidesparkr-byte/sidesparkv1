function ProfileSkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`skeleton-shimmer ${className}`.trim()} />;
}

export default function ProfileLoading() {
  return (
    <div className="space-y-5 pb-4">
      <section className="space-y-4 text-center">
        <ProfileSkeletonBlock className="mx-auto h-[72px] w-[72px] rounded-full" />
        <div className="space-y-2">
          <ProfileSkeletonBlock className="mx-auto h-6 w-32 rounded-full" />
          <ProfileSkeletonBlock className="mx-auto h-4 w-40 rounded-full" />
        </div>
        <ProfileSkeletonBlock className="mx-auto h-6 w-28 rounded-full" />
        <div className="flex items-start justify-center gap-4">
          <ProfileSkeletonBlock className="h-12 flex-1 rounded-2xl" />
          <ProfileSkeletonBlock className="h-12 flex-1 rounded-2xl" />
          <ProfileSkeletonBlock className="h-12 flex-1 rounded-2xl" />
        </div>
      </section>

      <div className="grid grid-cols-3 gap-2">
        <ProfileSkeletonBlock className="h-9 rounded-full" />
        <ProfileSkeletonBlock className="h-9 rounded-full" />
        <ProfileSkeletonBlock className="h-9 rounded-full" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`profile-listing-skeleton-${index}`}
            className="overflow-hidden rounded-[16px] border border-[var(--color-border)] bg-[var(--color-background)] shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
          >
            <ProfileSkeletonBlock className="aspect-[4/3] w-full" />
            <div className="space-y-2 p-2">
              <ProfileSkeletonBlock className="h-5 w-16 rounded-full" />
              <ProfileSkeletonBlock className="h-3 rounded" />
              <ProfileSkeletonBlock className="h-3 w-4/5 rounded" />
              <ProfileSkeletonBlock className="h-4 w-2/3 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

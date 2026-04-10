export default function RateTransactionLoading() {
  return (
    <div className="-mx-4 -my-3 flex min-h-[100dvh] items-center justify-center bg-white px-6">
      <div className="space-y-3 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-primary)]/15 border-t-[var(--color-primary)]" />
        <p className="text-sm text-[var(--color-text-muted)]">Loading...</p>
      </div>
    </div>
  );
}

import Link from "next/link";

import { Card } from "@/components/ui";
import { resolveSupabasePublicUrl } from "@/lib/media";
import type { MarketFeedItem } from "@/lib/market/types";
import { formatCurrency } from "@/lib/utils";

function categoryChipClasses(categoryLabel: string | null) {
  if (categoryLabel === "Books") {
    return "bg-[#EEFAF4] text-[#2D9B6F]";
  }
  if (categoryLabel === "Services") {
    return "bg-[#FFF4EF] text-[#FF6B35]";
  }
  return "bg-[#EEF2FF] text-[#0039A6]";
}

function SellerMeta({
  rating,
  totalTrades
}: {
  rating: number | null;
  totalTrades: number;
}) {
  if (typeof rating !== "number" || totalTrades === 0) {
    return null;
  }

  return (
    <div className="flex min-w-0 items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
      <span className="truncate">{`⭐ ${rating.toFixed(1)} · ${totalTrades} ${totalTrades === 1 ? "trade" : "trades"}`}</span>
    </div>
  );
}

export function ListingFeedCard({ item }: { item: MarketFeedItem }) {
  const resolvedPhotoUrl = resolveSupabasePublicUrl(item.photoUrl, "listing-photos");

  return (
    <Link href={item.href} className="block">
      <Card className="h-full overflow-hidden rounded-[16px] border border-[var(--color-border)] bg-[var(--color-background)] p-0 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:translate-y-0 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <div className="grid h-full min-h-[238px] grid-rows-[58fr_42fr]">
          <div className="relative overflow-hidden rounded-t-xl bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-2)]">
            <div className="absolute left-2 top-2 z-10 rounded-full bg-[#0039A6] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-white">
              Butler Verified
            </div>
            {resolvedPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolvedPhotoUrl}
                alt={item.title}
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[var(--color-text-muted)]">
                <svg
                  viewBox="0 0 24 24"
                  className="h-7 w-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  aria-hidden="true"
                >
                  <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z" />
                  <path d="m6.5 15 3-3 2.5 2.5 3.5-4 2 2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="9" cy="9" r="1.1" fill="currentColor" stroke="none" />
                </svg>
              </div>
            )}
          </div>

          <div className="space-y-1.5 p-2">
            <div
              className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${categoryChipClasses(item.categoryLabel)}`}
            >
              {item.categoryLabel ?? item.typeLabel}
            </div>
            <p className="line-clamp-2 text-[13px] font-semibold leading-[1.35] text-[var(--color-text-primary)]">
              {item.title}
            </p>
            <p className="mt-1 text-base font-bold leading-none text-[var(--color-text-primary)]">
              {formatCurrency(item.price)}
            </p>
            {item.totalTrades > 0 ? <SellerMeta rating={item.rating} totalTrades={item.totalTrades} /> : null}
          </div>
        </div>
      </Card>
    </Link>
  );
}

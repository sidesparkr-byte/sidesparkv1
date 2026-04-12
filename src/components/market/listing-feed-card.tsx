"use client";

import Link from "next/link";
import { BookOpen, ShoppingBag, Sparkles } from "lucide-react";

import { Card } from "@/components/ui";
import { resolveSupabasePublicUrl } from "@/lib/media";
import type { MarketFeedItem } from "@/lib/market/types";
import { formatCurrency, formatListingTitle } from "@/lib/utils";

function categoryChipClasses(categoryLabel: string | null) {
  if (categoryLabel === "Books") {
    return "bg-[#EEFAF4] text-[#2D9B6F]";
  }
  if (categoryLabel === "Services") {
    return "bg-[#FFF4EF] text-[#FF6B35]";
  }
  return "bg-[#EEF2FF] text-[#0039A6]";
}

function CategoryIcon({ categoryLabel, className }: { categoryLabel: string | null; className: string }) {
  if (categoryLabel === "Books") {
    return <BookOpen aria-hidden="true" className={className} strokeWidth={1.8} />;
  }
  if (categoryLabel === "Services") {
    return <Sparkles aria-hidden="true" className={className} strokeWidth={1.8} />;
  }
  return <ShoppingBag aria-hidden="true" className={className} strokeWidth={1.8} />;
}

function PhotoPlaceholder({
  categoryLabel,
  hidden = false
}: {
  categoryLabel: string | null;
  hidden?: boolean;
}) {
  return (
    <div
      className={`${hidden ? "hidden " : ""}flex h-full w-full items-center justify-center rounded-t-xl bg-[linear-gradient(135deg,#EEF2FF,#E8F4FD)] text-[#0039A6]`}
    >
      <CategoryIcon categoryLabel={categoryLabel} className="h-6 w-6" />
    </div>
  );
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
        <div className="flex h-full flex-col">
          <div className="relative aspect-square w-full overflow-hidden rounded-t-xl bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-2)]">
            <div className="absolute left-2 top-2 z-10 rounded-full bg-[#0039A6] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-white">
              Butler Verified
            </div>
            {resolvedPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <>
                <img
                  src={resolvedPhotoUrl}
                  alt={item.title}
                  className="h-full w-full object-cover object-center"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextElementSibling?.classList.remove("hidden");
                  }}
                />
                <PhotoPlaceholder categoryLabel={item.categoryLabel} hidden />
              </>
            ) : (
              <PhotoPlaceholder categoryLabel={item.categoryLabel} />
            )}
          </div>

          <div className="flex min-h-[88px] flex-col px-3 py-2.5">
            <div
              className={`mb-1.5 inline-flex h-[22px] w-fit items-center rounded-full px-2 text-[10px] font-semibold uppercase tracking-[0.08em] ${categoryChipClasses(item.categoryLabel)}`}
            >
              {item.categoryLabel ?? item.typeLabel}
            </div>
            <p className="line-clamp-2 overflow-hidden text-[13px] font-semibold leading-[1.35] text-[var(--color-text-primary)] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
              {formatListingTitle(item.title)}
            </p>
            <p className="mt-auto pt-1 text-[15px] font-bold leading-none text-[var(--color-text-primary)]">
              {formatCurrency(item.price)}
            </p>
            {item.totalTrades > 0 ? <SellerMeta rating={item.rating} totalTrades={item.totalTrades} /> : null}
          </div>
        </div>
      </Card>
    </Link>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type TouchEvent } from "react";

import { ListingFeedCard } from "@/components/market/listing-feed-card";
import { Card } from "@/components/ui";
import { MAIN_CATEGORY_LABELS, canonicalCategoryLabel } from "@/lib/market/filters";
import type { MarketFeedItem, MarketMainCategory } from "@/lib/market/types";
import { createClient } from "@/lib/supabase/client";

const PAGE_SIZE = 20;

type ListingQueryRow = {
  id: string;
  title: string;
  price: number;
  photos: string[] | null;
  category: string | null;
  type: "item" | "service";
  created_at: string;
  profiles:
    | {
        first_name: string | null;
        last_initial: string | null;
        average_rating: number | null;
        total_trades: number | null;
      }
    | {
        first_name: string | null;
        last_initial: string | null;
        average_rating: number | null;
        total_trades: number | null;
      }[]
    | null;
};

function getProfileObject(row: ListingQueryRow) {
  if (!row.profiles) {
    return null;
  }
  return Array.isArray(row.profiles) ? row.profiles[0] ?? null : row.profiles;
}

function toFeedItem(row: ListingQueryRow): MarketFeedItem {
  const profile = getProfileObject(row);
  const firstName = profile?.first_name?.trim() || "Butler";
  const lastInitial = profile?.last_initial?.trim();
  const sellerDisplayName = `${firstName}${lastInitial ? ` ${lastInitial.toUpperCase()}.` : ""}`;

  return {
    id: row.id,
    source: "listing",
    createdAt: row.created_at,
    href: `/market/${row.id}`,
    title: row.title,
    price: Number(row.price),
    photoUrl: row.photos?.[0] ?? null,
    sellerFirstName: firstName,
    sellerDisplayName,
    rating:
      typeof profile?.average_rating === "number"
        ? Number(Number(profile.average_rating).toFixed(1))
        : null,
    totalTrades: Number(profile?.total_trades ?? 0),
    distanceLabel: "Butler Campus",
    categoryLabel: canonicalCategoryLabel(row.category, row.type),
    typeLabel: row.type === "service" ? "Service" : "Item"
  };
}

function SkeletonCard() {
  return (
    <div className="h-full min-h-[238px] overflow-hidden rounded-[16px] border border-[var(--color-border)] bg-[var(--color-background)] p-0 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <div className="grid h-full grid-rows-[58fr_42fr]">
        <div className="skeleton-shimmer rounded-t-xl" />
        <div className="space-y-2 p-2">
          <div className="skeleton-shimmer h-5 w-16 rounded-full" />
          <div className="skeleton-shimmer h-3 rounded" />
          <div className="skeleton-shimmer h-3 w-4/5 rounded" />
          <div className="skeleton-shimmer h-4 w-2/3 rounded" />
        </div>
      </div>
    </div>
  );
}

function getScrollContainer() {
  return typeof document === "undefined"
    ? null
    : document.getElementById("main-shell-scroll");
}

export function FeedLanding() {
  const router = useRouter();
  const supabase = createClient();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const requestIdRef = useRef(0);
  const touchStartYRef = useRef<number | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<MarketMainCategory>("all");
  const [results, setResults] = useState<MarketFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pullDistance, setPullDistance] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const checkProfileCompletion = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name,terms_accepted_at")
        .eq("id", session.user.id)
        .single();

      if (isMounted && (!profile?.first_name || !profile?.terms_accepted_at)) {
        router.push("/onboarding");
      }
    };

    void checkProfileCompletion();

    return () => {
      isMounted = false;
    };
  }, []);

  const executeQuery = useCallback(
    async ({
      category,
      nextPage,
      replace,
      refresh = false
    }: {
      category: MarketMainCategory;
      nextPage: number;
      replace: boolean;
      refresh?: boolean;
    }) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      setError(null);
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      let builder = supabase
        .from("listings")
        .select(
          "id,title,price,photos,category,type,created_at,profiles!listings_seller_id_fkey(first_name,last_initial,average_rating,total_trades)"
        )
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .range(nextPage * PAGE_SIZE, nextPage * PAGE_SIZE + PAGE_SIZE - 1);

      if (category !== "all") {
        const categoryLabel =
          category === "items" ? "Items" : category === "books" ? "Books" : "Services";
        builder = builder.eq("category", categoryLabel);
      }

      const { data, error: queryError } = await builder;

      if (requestIdRef.current !== requestId) {
        return;
      }

      if (queryError) {
        setError(queryError.message);
        if (replace) {
          setResults([]);
        }
        setHasMore(false);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      const mapped = ((data ?? []) as ListingQueryRow[]).map(toFeedItem);
      setResults((current) => (replace ? mapped : [...current, ...mapped]));
      setHasMore(mapped.length === PAGE_SIZE);
      setPage(nextPage);
      setIsLoading(false);
      setIsRefreshing(false);
    },
    [supabase]
  );

  useEffect(() => {
    void executeQuery({
      category: selectedCategory,
      nextPage: 0,
      replace: true
    });
  }, [executeQuery, selectedCategory]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || isLoading || isRefreshing || !hasMore) {
          return;
        }

        void executeQuery({
          category: selectedCategory,
          nextPage: page + 1,
          replace: false
        });
      },
      { rootMargin: "320px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [executeQuery, hasMore, isLoading, isRefreshing, page, selectedCategory]);

  const handleRefresh = useCallback(() => {
    void executeQuery({
      category: selectedCategory,
      nextPage: 0,
      replace: true,
      refresh: true
    });
  }, [executeQuery, selectedCategory]);

  const handleTouchStart = useCallback((event: TouchEvent<HTMLDivElement>) => {
    const scrollContainer = getScrollContainer();
    if (scrollContainer?.scrollTop === 0) {
      touchStartYRef.current = event.touches[0]?.clientY ?? null;
    } else {
      touchStartYRef.current = null;
    }
  }, []);

  const handleTouchMove = useCallback((event: TouchEvent<HTMLDivElement>) => {
    if (touchStartYRef.current == null) {
      return;
    }

    const scrollContainer = getScrollContainer();
    if (scrollContainer?.scrollTop !== 0) {
      setPullDistance(0);
      return;
    }

    const currentY = event.touches[0]?.clientY ?? touchStartYRef.current;
    const delta = currentY - touchStartYRef.current;

    if (delta > 0) {
      setPullDistance(Math.min(delta * 0.45, 88));
    } else {
      setPullDistance(0);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (pullDistance >= 64) {
      handleRefresh();
    }
    touchStartYRef.current = null;
    setPullDistance(0);
  }, [handleRefresh, pullDistance]);

  return (
    <div
      className="-mx-4 -mt-3 space-y-4 overflow-x-hidden pb-2"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[color:rgba(255,255,255,0.96)] pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-[color:rgba(255,255,255,0.84)]">
        <div
          className="flex items-end justify-center overflow-hidden transition-[height] duration-150 ease-out"
          style={{ height: pullDistance > 0 || isRefreshing ? Math.max(pullDistance, 36) : 0 }}
        >
          <span className="pb-2 text-xs font-medium text-[var(--color-text-muted)]">
            {isRefreshing ? "Refreshing feed..." : pullDistance >= 64 ? "Release to refresh" : "Pull to refresh"}
          </span>
        </div>

        <div className="flex h-14 items-center justify-between px-4">
          <span className="text-lg font-semibold tracking-tight text-[var(--color-text-primary)]">
            SideSpark
          </span>
          <button
            type="button"
            onClick={() => router.push("/market")}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface)]"
            aria-label="Search Market"
          >
            <Search className="h-[22px] w-[22px]" strokeWidth={2} />
          </button>
        </div>

        <div className="app-scroll flex gap-2 overflow-x-auto px-4 pb-3">
          {MAIN_CATEGORY_LABELS.map((chip) => {
            const active = chip.value === selectedCategory;
            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => setSelectedCategory(chip.value)}
                className={
                  active
                    ? "inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-full bg-[#0039A6] px-4 text-[13px] font-semibold text-white transition-all duration-150 ease-in-out"
                    : "inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-full bg-[#F5F5F5] px-4 text-[13px] font-semibold text-[#6B6B6B] transition-all duration-150 ease-in-out"
                }
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4">
        {error ? (
          <div className="mb-4 rounded-xl border border-[color:rgba(255,107,53,0.24)] bg-[color:rgba(255,107,53,0.10)] px-3 py-2 text-sm text-[var(--color-accent)]">
            {error}
          </div>
        ) : null}

        {isLoading && results.length === 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={`feed-skeleton-${index}`} />
            ))}
          </div>
        ) : results.length === 0 ? (
          <Card className="space-y-4 rounded-2xl p-5 text-center">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                SideSpark is just getting started
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Be the first to list something →
              </p>
            </div>
            <Link
              href="/market/sell"
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-semibold text-white"
            >
              List Something
            </Link>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {results.map((item) => (
                <ListingFeedCard key={`${item.source}:${item.id}`} item={item} />
              ))}
            </div>

            <div ref={sentinelRef} className="flex min-h-10 items-center justify-center">
              {isLoading ? (
                <span className="text-xs text-[var(--color-text-muted)]">Loading more…</span>
              ) : hasMore ? (
                <span className="text-xs text-[var(--color-text-muted)]">Scroll for more</span>
              ) : (
                <span className="text-xs text-[var(--color-text-muted)]">You&apos;re all caught up</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

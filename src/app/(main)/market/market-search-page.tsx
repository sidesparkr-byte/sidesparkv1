"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { ListingFeedCard } from "@/components/market/listing-feed-card";
import { Card } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { canonicalCategoryLabel } from "@/lib/market/filters";
import type { MarketFeedItem, MarketMainCategory } from "@/lib/market/types";

const PAGE_SIZE = 20;
const RECENT_SEARCHES_KEY = "ss_recent_searches";

type ListingQueryRow = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  photos: string[] | null;
  category: string | null;
  type: "item" | "service";
  created_at: string;
  seller_id: string;
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

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4 text-[#9A9A9A]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path
        d="m13.8 13.8 3.2 3.2M8.8 14.6a5.8 5.8 0 1 0 0-11.6 5.8 5.8 0 0 0 0 11.6Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="m6 6 8 8m0-8-8 8" strokeLinecap="round" />
    </svg>
  );
}

function CategoryIcon({ category }: { category: MarketMainCategory }) {
  if (category === "books") {
    return (
      <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M5.5 6.5A2.5 2.5 0 0 1 8 4h9v15.5H8A2.5 2.5 0 0 0 5.5 22V6.5Z" strokeLinejoin="round" />
        <path d="M8 4v15.5M10.5 8h4.5M10.5 11h4.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (category === "services") {
    return (
      <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h2.1l1.2-1.6h4.4L15.4 6h2.1A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z" strokeLinejoin="round" />
        <circle cx="12" cy="12.5" r="3.2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M7 11V8.5A2.5 2.5 0 0 1 9.5 6h5A2.5 2.5 0 0 1 17 8.5V11" strokeLinecap="round" />
      <path d="M6 11h12v5H6z" strokeLinejoin="round" />
      <path d="M7 16v2.5M17 16v2.5M4.5 18.5h15" strokeLinecap="round" />
    </svg>
  );
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
          <div className="skeleton-shimmer mt-1 h-4 w-2/3 rounded" />
          <div className="skeleton-shimmer h-3 w-3/4 rounded" />
        </div>
      </div>
    </div>
  );
}

function readRecentSearches() {
  if (typeof window === "undefined") {
    return [] as string[];
  }

  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
}

function writeRecentSearches(term: string) {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = term.trim();
  if (!normalized) {
    return;
  }

  const current = readRecentSearches();
  const next = [normalized, ...current.filter((item) => item.toLowerCase() !== normalized.toLowerCase())].slice(0, 5);
  window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
}

export function MarketSearchPage() {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<MarketMainCategory>("all");
  const [results, setResults] = useState<MarketFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const executeQuery = useCallback(
    async ({
      query,
      category,
      nextPage,
      replace
    }: {
      query: string;
      category: MarketMainCategory;
      nextPage: number;
      replace: boolean;
    }) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      setIsLoading(true);
      setError(null);

      let builder = supabase
        .from("listings")
        .select(
          "id,title,description,price,photos,category,type,created_at,seller_id,profiles!listings_seller_id_fkey(first_name,last_initial,average_rating,total_trades)",
          { count: nextPage === 0 ? "exact" : undefined }
        )
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .range(nextPage * PAGE_SIZE, nextPage * PAGE_SIZE + PAGE_SIZE - 1);

      const trimmedQuery = query.trim();
      if (trimmedQuery) {
        const escaped = trimmedQuery.replace(/[%_,]/g, (match) => `\\${match}`);
        builder = builder.or(`title.ilike.%${escaped}%,description.ilike.%${escaped}%`);
      }

      if (category !== "all") {
        const categoryLabel =
          category === "items" ? "Items" : category === "books" ? "Books" : "Services";
        builder = builder.eq("category", categoryLabel);
      }

      const { data, error: queryError, count } = await builder;

      if (requestIdRef.current !== requestId) {
        return;
      }

      if (queryError) {
        setError(queryError.message);
        setResults((current) => (replace ? [] : current));
        setHasMore(false);
        setIsLoading(false);
        return;
      }

      const mapped = ((data ?? []) as ListingQueryRow[]).map(toFeedItem);

      setResults((current) => (replace ? mapped : [...current, ...mapped]));
      setHasMore(mapped.length === PAGE_SIZE);
      setPage(nextPage);
      if (typeof count === "number") {
        setTotalCount(count);
      } else if (replace) {
        setTotalCount(mapped.length);
      }
      if (replace && trimmedQuery) {
        writeRecentSearches(trimmedQuery);
        setRecentSearches(readRecentSearches());
      }
      setIsLoading(false);
    },
    [supabase]
  );

  const debouncedSearch = useCallback(
    (value: string, category: MarketMainCategory) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        void executeQuery({
          query: value,
          category,
          nextPage: 0,
          replace: true
        });
      }, 300);
    },
    [executeQuery]
  );

  useEffect(() => {
    setRecentSearches(readRecentSearches());
    void executeQuery({
      query: "",
      category: "all",
      nextPage: 0,
      replace: true
    });

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [executeQuery]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || isLoading || !hasMore) {
          return;
        }

        void executeQuery({
          query: searchQuery,
          category: selectedCategory,
          nextPage: page + 1,
          replace: false
        });
      },
      { rootMargin: "320px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [executeQuery, hasMore, isLoading, page, searchQuery, selectedCategory]);

  const handleInputChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      debouncedSearch(value, selectedCategory);
    },
    [debouncedSearch, selectedCategory]
  );

  const handleCategoryChange = useCallback(
    (category: MarketMainCategory) => {
      setSelectedCategory(category);
      void executeQuery({
        query: searchQuery,
        category,
        nextPage: 0,
        replace: true
      });
    },
    [executeQuery, searchQuery]
  );

  const applyRecentSearch = useCallback(
    (term: string) => {
      setSearchQuery(term);
      void executeQuery({
        query: term,
        category: selectedCategory,
        nextPage: 0,
        replace: true
      });
    },
    [executeQuery, selectedCategory]
  );

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    void executeQuery({
      query: "",
      category: selectedCategory,
      nextPage: 0,
      replace: true
    });
    inputRef.current?.focus();
  }, [executeQuery, selectedCategory]);

  const countLabel = searchQuery.trim()
    ? `${totalCount} ${totalCount === 1 ? "result" : "results"} for '${searchQuery.trim()}'`
    : selectedCategory === "all"
      ? `${totalCount} ${totalCount === 1 ? "listing" : "listings"}`
      : `${totalCount} ${selectedCategory === "items" ? "Items" : selectedCategory === "books" ? "Books" : "Services"}`;

  const emptyCategoryLabel =
    selectedCategory === "items" ? "Items" : selectedCategory === "books" ? "Books" : "Services";

  return (
    <div className="space-y-4 overflow-x-hidden pb-2">
      <div className="sticky top-0 z-10 -mx-4 bg-[color:rgba(245,245,245,0.95)] px-4 pb-3 pt-[max(8px,env(safe-area-inset-top))] backdrop-blur supports-[backdrop-filter]:bg-[color:rgba(245,245,245,0.82)]">
        <div className="space-y-3">
          <div
            className="flex h-12 items-center gap-2 rounded-full bg-[#F5F5F5] px-4"
            role="search"
            aria-label="Search Market"
          >
            <SearchIcon />
            <input
              ref={inputRef}
              type="search"
              value={searchQuery}
              onChange={(event) => handleInputChange(event.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => {
                window.setTimeout(() => setIsSearchFocused(false), 150);
              }}
              placeholder="Search items, books, services..."
              className="h-full w-full bg-transparent text-base text-[var(--color-text-primary)] outline-none placeholder:text-[#9A9A9A]"
            />
            {searchQuery.trim() ? (
              <button
                type="button"
                onClick={clearSearch}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-[#9A9A9A]"
                aria-label="Clear search"
              >
                <ClearIcon />
              </button>
            ) : null}
          </div>

          {isSearchFocused && searchQuery.length === 0 && recentSearches.length > 0 ? (
            <div>
              <p className="mb-1.5 px-1 text-left text-[11px] text-[#9A9A9A]">Recent</p>
              <div className="app-scroll -mx-1 flex gap-2 overflow-x-auto px-1">
                {recentSearches.slice(0, 3).map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => applyRecentSearch(term)}
                    className="inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#F5F5F5] px-3 text-[12px] font-medium text-[#6B6B6B]"
                  >
                    <Clock aria-hidden="true" className="h-3 w-3 text-[#9A9A9A]" strokeWidth={2} />
                    <span>{term}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="app-scroll -mx-1 flex gap-2 overflow-x-auto px-1">
            {[
              { value: "all" as const, label: "All" },
              { value: "items" as const, label: "Items" },
              { value: "books" as const, label: "Books" },
              { value: "services" as const, label: "Services" }
            ].map((chip) => {
              const active = chip.value === selectedCategory;
              return (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => handleCategoryChange(chip.value)}
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

          <div className="px-1">
            <p className="text-[13px] text-[#9A9A9A]">{countLabel}</p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-[color:rgba(255,107,53,0.24)] bg-[color:rgba(255,107,53,0.10)] px-3 py-2 text-sm text-[var(--color-accent)]">
          {error}
        </div>
      ) : null}

      {isLoading && results.length === 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : results.length === 0 ? (
        searchQuery.trim() ? (
          <Card className="space-y-4 rounded-2xl p-5 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center text-[var(--color-text-muted)]">
              <SearchIcon />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                {`Nothing found for '${searchQuery.trim()}'`}
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Be the first to list this on SideSpark
              </p>
            </div>
            <Link
              href="/market/sell"
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-semibold text-white"
            >
              Sell Yours →
            </Link>
          </Card>
        ) : selectedCategory !== "all" ? (
          <Card className="space-y-4 rounded-2xl p-5 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center text-[var(--color-text-muted)]">
              <CategoryIcon category={selectedCategory} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                {`No ${emptyCategoryLabel} listed yet`}
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Check back soon — or be the first
              </p>
            </div>
            <Link
              href={
                selectedCategory === "services"
                  ? "/market/sell/service"
                  : `/market/sell/item?category=${encodeURIComponent(selectedCategory === "books" ? "Books" : "Items")}`
              }
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-semibold text-white"
            >
              List Something →
            </Link>
          </Card>
        ) : (
          <Card className="space-y-4 rounded-2xl p-5 text-center">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                No listings yet
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Check back soon — or be the first to post something on SideSpark.
              </p>
            </div>
            <Link
              href="/market/sell"
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-semibold text-white"
            >
              List Something →
            </Link>
          </Card>
        )
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
  );
}

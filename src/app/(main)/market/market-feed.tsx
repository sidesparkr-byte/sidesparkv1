"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  startTransition
} from "react";

import { Card, EmptyState } from "@/components/ui";
import { ListingFeedCard } from "@/components/market/listing-feed-card";
import { resolveSupabasePublicUrl } from "@/lib/media";
import {
  SUBCATEGORY_MAP,
  normalizeMainCategory
} from "@/lib/market/filters";
import type {
  MarketFeedItem,
  MarketFeedResponse,
  MarketMainCategory
} from "@/lib/market/types";
import { formatCurrency } from "@/lib/utils";

type MarketFeedProps = {
  initialMain: string | null;
  initialSub: string | null;
  initialQuery: string | null;
  variant?: "browse" | "feed";
};

function buildSearchParams({
  main,
  sub,
  q
}: {
  main: MarketMainCategory;
  sub: string | null;
  q: string;
}) {
  const params = new URLSearchParams();
  if (main !== "all") {
    params.set("main", main);
  }
  if (sub) {
    params.set("sub", sub);
  }
  if (q.trim()) {
    params.set("q", q.trim());
  }
  return params;
}

function MarketSearchIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4 text-[var(--color-text-muted)]"
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

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={spinning ? "h-4 w-4 animate-spin" : "h-4 w-4"}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M15.5 8a5.5 5.5 0 1 0 .8 4.1" strokeLinecap="round" />
      <path d="M12.8 4.6h3.6v3.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-3.5 w-3.5 text-[var(--color-text-muted)]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="6.5" />
      <path d="M10 6.6v3.9l2.5 1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChairIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M7 11V8.5A2.5 2.5 0 0 1 9.5 6h5A2.5 2.5 0 0 1 17 8.5V11" strokeLinecap="round" />
      <path d="M6 11h12v5H6z" strokeLinejoin="round" />
      <path d="M7 16v2.5M17 16v2.5M4.5 18.5h15" strokeLinecap="round" />
    </svg>
  );
}

function BooksIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M5.5 6.5A2.5 2.5 0 0 1 8 4h9v15.5H8A2.5 2.5 0 0 0 5.5 22V6.5Z" strokeLinejoin="round" />
      <path d="M8 4v15.5M10.5 8h4.5M10.5 11h4.5" strokeLinecap="round" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h2.1l1.2-1.6h4.4L15.4 6h2.1A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z" strokeLinejoin="round" />
      <circle cx="12" cy="12.5" r="3.2" />
    </svg>
  );
}

type CategoryTileProps = {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  backgroundClassName: string;
};

function CategoryTile({
  label,
  active,
  onClick,
  icon,
  backgroundClassName
}: CategoryTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative aspect-square min-h-[140px] overflow-hidden rounded-2xl text-left transition-transform duration-150 ${active ? "ring-2 ring-[var(--color-primary)] ring-offset-2" : ""}`}
    >
      <div className={`absolute inset-0 ${backgroundClassName}`} />
      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(15,23,42,0.78)] via-[rgba(15,23,42,0.24)] to-[rgba(15,23,42,0.05)]" />
      <div className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/14 backdrop-blur-sm">
        {icon}
      </div>
      <div className="absolute bottom-3 left-3 right-3">
        <p className="text-base font-semibold text-white">{label}</p>
      </div>
    </button>
  );
}

function RecentListingCard({ item }: { item: MarketFeedItem }) {
  const resolvedPhotoUrl = resolveSupabasePublicUrl(item.photoUrl, "listing-photos");

  return (
    <Link
      href={item.href}
      className="block w-[126px] shrink-0 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
    >
      <div className="aspect-square overflow-hidden bg-[var(--color-surface)]">
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
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z" />
              <path d="m6.5 15 3-3 2.5 2.5 3.5-4 2 2.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9" cy="9" r="1.1" fill="currentColor" stroke="none" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="text-sm font-bold text-[var(--color-text-primary)]">{formatCurrency(item.price)}</p>
      </div>
    </Link>
  );
}

export function MarketFeed({
  initialMain,
  initialSub,
  initialQuery,
  variant = "browse"
}: MarketFeedProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [main, setMain] = useState<MarketMainCategory>(
    normalizeMainCategory(initialMain)
  );
  const [sub, setSub] = useState<string | null>(initialSub?.trim() || null);
  const [query, setQuery] = useState(initialQuery ?? "");
  const deferredQuery = useDeferredValue(query);

  const [items, setItems] = useState<MarketFeedItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestKey = useMemo(
    () =>
      JSON.stringify({
        main,
        sub: sub ?? null,
        q: deferredQuery.trim()
      }),
    [main, sub, deferredQuery]
  );

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const activeRequestRef = useRef(0);
  const recentSearches = ["desk lamp", "econ textbook", "moving help"];
  const recentListings = items.slice(0, 4);

  const subcategoryOptions = SUBCATEGORY_MAP[main] ?? [];

  useEffect(() => {
    if (sub && !subcategoryOptions.includes(sub)) {
      setSub(null);
    }
  }, [sub, subcategoryOptions]);

  useEffect(() => {
    const params = buildSearchParams({
      main,
      sub,
      q: deferredQuery
    });
    startTransition(() => {
      router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`, {
        scroll: false
      });
    });
  }, [deferredQuery, main, sub, pathname, router]);

  useEffect(() => {
    let isCancelled = false;
    const requestId = activeRequestRef.current + 1;
    activeRequestRef.current = requestId;

    async function loadInitial() {
      setLoadingInitial(true);
      setError(null);

      const params = buildSearchParams({
        main,
        sub,
        q: deferredQuery
      });
      params.set("limit", "18");

      try {
        const response = await fetch(`/api/market?${params.toString()}`, {
          cache: "no-store"
        });
        if (!response.ok) {
          throw new Error("Unable to load listings.");
        }

        const data = (await response.json()) as MarketFeedResponse;
        if (isCancelled || activeRequestRef.current !== requestId) {
          return;
        }

        setItems(data.items);
        setNextCursor(data.nextCursor);
      } catch (err) {
        if (isCancelled) {
          return;
        }
        setError(err instanceof Error ? err.message : "Unable to load listings.");
        setItems([]);
        setNextCursor(null);
      } finally {
        if (!isCancelled) {
          setLoadingInitial(false);
        }
      }
    }

    loadInitial();

    return () => {
      isCancelled = true;
    };
  }, [requestKey, deferredQuery, main, sub]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || loadingInitial || loadingMore || !nextCursor) {
          return;
        }

        setLoadingMore(true);
        setError(null);

        const params = buildSearchParams({
          main,
          sub,
          q: deferredQuery
        });
        params.set("limit", "18");
        params.set("cursor", nextCursor);

        fetch(`/api/market?${params.toString()}`, { cache: "no-store" })
          .then(async (response) => {
            if (!response.ok) {
              throw new Error("Unable to load more listings.");
            }
            return (await response.json()) as MarketFeedResponse;
          })
          .then((data) => {
            setItems((current) => {
              const seen = new Set(current.map((item) => `${item.source}:${item.id}`));
              const merged = [...current];
              data.items.forEach((item) => {
                const key = `${item.source}:${item.id}`;
                if (!seen.has(key)) {
                  seen.add(key);
                  merged.push(item);
                }
              });
              return merged;
            });
            setNextCursor(data.nextCursor);
          })
          .catch((err) => {
            setError(err instanceof Error ? err.message : "Unable to load more listings.");
          })
          .finally(() => {
            setLoadingMore(false);
          });
      },
      { rootMargin: "400px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [deferredQuery, loadingInitial, loadingMore, main, nextCursor, sub]);

  async function handleRefresh() {
    setRefreshing(true);
    setError(null);
    const params = buildSearchParams({
      main,
      sub,
      q: deferredQuery
    });
    params.set("limit", "18");

    try {
      const response = await fetch(`/api/market?${params.toString()}`, {
        cache: "no-store"
      });
      if (!response.ok) {
        throw new Error("Unable to refresh listings.");
      }
      const data = (await response.json()) as MarketFeedResponse;
      setItems(data.items);
      setNextCursor(data.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to refresh listings.");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="space-y-4 pb-2">
      <div className="sticky top-0 z-10 -mx-4 bg-[color:rgba(245,245,245,0.95)] px-4 pb-2 pt-1 backdrop-blur supports-[backdrop-filter]:bg-[color:rgba(245,245,245,0.82)]">
        {variant === "feed" ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1 pt-2">
              <span className="text-[28px] font-semibold tracking-tight text-[var(--color-text-primary)]">
                SideSpark
              </span>
              <Link
                href="/market"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-[var(--color-background)] text-[var(--color-text-secondary)] shadow-[0_4px_14px_rgba(26,26,26,0.06)]"
                aria-label="Open market search"
              >
                <MarketSearchIcon />
              </Link>
            </div>

            <div className="app-scroll -mx-1 flex gap-2 overflow-x-auto px-1">
              {[
                { value: "all" as const, label: "All" },
                { value: "items" as const, label: "Items" },
                { value: "books" as const, label: "Books" },
                { value: "services" as const, label: "Services" }
              ].map((chip) => {
                const active = chip.value === main;
                return (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => {
                      setMain(chip.value);
                      setSub(null);
                    }}
                    className={
                      active
                        ? "h-9 shrink-0 rounded-full bg-[#0039A6] px-4 text-[13px] font-semibold text-white transition-colors duration-150 ease-in-out"
                        : "h-9 shrink-0 rounded-full bg-[#F5F5F5] px-4 text-[13px] font-semibold text-[#6B6B6B] transition-colors duration-150 ease-in-out"
                    }
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2 px-1 pt-2">
              <h1 className="text-[30px] font-semibold leading-[1.02] tracking-tight text-[var(--color-text-primary)]">
                Find what you <span className="italic text-[var(--color-primary)]">need.</span>
              </h1>
              <p className="max-w-[30ch] text-sm leading-6 text-[var(--color-text-secondary)]">
                Browse student listings, books, and campus services in one place.
              </p>
            </div>

            <form
              onSubmit={(event) => event.preventDefault()}
              className="flex items-center gap-2"
              role="search"
              aria-label="Search SideSpark"
            >
              <div className="flex h-12 flex-1 items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 shadow-[0_8px_18px_rgba(26,26,26,0.05)]">
                <MarketSearchIcon />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search SideSpark…"
                  className="h-full w-full bg-transparent text-base text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-4 text-[13px] font-semibold uppercase tracking-[0.04em] text-white shadow-[0_10px_24px_rgba(0,57,166,0.18)]"
              >
                Search
              </button>
            </form>

            <div className="space-y-2 px-1">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Recent Searches</h2>
                <Link
                  href="/market/sell"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--color-primary)] px-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(0,57,166,0.18)]"
                >
                  Sell
                </Link>
              </div>
              <div className="app-scroll -mx-1 flex gap-2 overflow-x-auto px-1">
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setQuery(term)}
                    className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-[var(--color-background)] px-3 text-[13px] font-medium text-[var(--color-text-secondary)] shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                  >
                    <ClockIcon />
                    <span>{term}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 px-1">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Categories</h2>
                <button
                  type="button"
                  onClick={() => {
                    setMain("all");
                    setSub(null);
                  }}
                  className={
                    main === "all"
                      ? "inline-flex h-9 items-center rounded-full bg-[#0039A6] px-4 text-[13px] font-semibold text-white transition-colors duration-150 ease-in-out"
                      : "inline-flex h-9 items-center rounded-full bg-[#F5F5F5] px-4 text-[13px] font-semibold text-[#6B6B6B] transition-colors duration-150 ease-in-out"
                  }
                >
                  All
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <CategoryTile
                  label="Items"
                  active={main === "items"}
                  onClick={() => {
                    setMain("items");
                    setSub(null);
                  }}
                  icon={<ChairIcon />}
                  backgroundClassName="bg-[linear-gradient(135deg,#8EA8D7_0%,#5C7BB8_45%,#2B3E68_100%)]"
                />
                <CategoryTile
                  label="Books"
                  active={main === "books"}
                  onClick={() => {
                    setMain("books");
                    setSub(null);
                  }}
                  icon={<BooksIcon />}
                  backgroundClassName="bg-[linear-gradient(135deg,#85BFA1_0%,#5AA57C_45%,#225C46_100%)]"
                />
                <CategoryTile
                  label="Services"
                  active={main === "services"}
                  onClick={() => {
                    setMain("services");
                    setSub(null);
                  }}
                  icon={<CameraIcon />}
                  backgroundClassName="bg-[linear-gradient(135deg,#FFB08B_0%,#FF8150_48%,#A64A1E_100%)]"
                />
              </div>
            </div>

            <div className="space-y-2 px-1">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Recently Listed</h2>
                <span className="text-xs text-[var(--color-text-muted)]">Latest active posts</span>
              </div>
              {loadingInitial ? (
                <div className="app-scroll -mx-1 flex gap-3 overflow-x-auto px-1">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="w-[126px] shrink-0 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                    >
                      <div className="aspect-square animate-pulse bg-[var(--color-surface)]" />
                      <div className="p-2">
                        <div className="h-4 w-16 animate-pulse rounded bg-[var(--color-surface)]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentListings.length > 0 ? (
                <div className="app-scroll -mx-1 flex gap-3 overflow-x-auto px-1">
                  {recentListings.map((item) => (
                    <RecentListingCard key={`recent-${item.source}:${item.id}`} item={item} />
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[color:rgba(255,255,255,0.84)] px-3 py-2 text-xs text-[var(--color-text-secondary)] shadow-[0_8px_18px_rgba(26,26,26,0.04)]">
              <span>Pull to refresh feel</span>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-xl px-2 text-xs font-medium text-[var(--color-primary)] disabled:opacity-60"
              >
                <RefreshIcon spinning={refreshing} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {error ? (
        <div className="rounded-xl border border-[color:rgba(255,107,53,0.24)] bg-[color:rgba(255,107,53,0.10)] px-3 py-2 text-sm text-[var(--color-accent)]">
          {error}
        </div>
      ) : null}

      {loadingInitial ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card
                key={index}
                className="h-full min-h-[238px] animate-pulse overflow-hidden rounded-[16px] border border-[var(--color-border)] bg-[var(--color-background)] p-0 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
              >
                <div className="grid h-full grid-rows-[58fr_42fr]">
                  <div className="rounded-t-xl bg-[var(--color-surface)]" />
                  <div className="space-y-2 p-2">
                    <div className="h-5 w-16 rounded-full bg-[var(--color-surface)]" />
                    <div className="h-3 rounded bg-[var(--color-surface)]" />
                    <div className="h-3 w-4/5 rounded bg-[var(--color-surface)]" />
                    <div className="mt-1 h-4 w-2/3 rounded bg-[var(--color-surface)]" />
                    <div className="h-3 w-3/4 rounded bg-[var(--color-surface)]" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M5 7.5A2.5 2.5 0 0 1 7.5 5h9A2.5 2.5 0 0 1 19 7.5v9A2.5 2.5 0 0 1 16.5 19h-9A2.5 2.5 0 0 1 5 16.5v-9Z" />
              <path d="m8.3 11.6 2.3 2.3 5.1-5.1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          title="Can't find what you need?"
          subtitle="Try a different search, clear a filter, or check back later for new listings."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <ListingFeedCard key={`${item.source}:${item.id}`} item={item} />
            ))}
          </div>

          <div ref={sentinelRef} className="flex min-h-10 items-center justify-center">
            {loadingMore ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] shadow-[0_8px_18px_rgba(26,26,26,0.05)]">
                <RefreshIcon spinning />
                Loading more
              </div>
            ) : nextCursor ? (
              <span className="text-xs text-[var(--color-text-muted)]">Scroll for more</span>
            ) : (
              <span className="text-xs text-[var(--color-text-muted)]">You're all caught up</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

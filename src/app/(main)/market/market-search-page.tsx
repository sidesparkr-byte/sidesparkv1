"use client";

import Link from "next/link";
import {
  BookOpen,
  ChevronDown,
  Home,
  Search,
  SearchX,
  ShoppingBag,
  Sparkles
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ListingFeedCard } from "@/components/market/listing-feed-card";
import type { MarketFeedItem } from "@/lib/market/types";
import { createClient } from "@/lib/supabase/client";

const PAGE_SIZE = 20;

type CategoryBlockId = "items" | "books" | "furniture" | "services";

type CategoryBlock = {
  id: CategoryBlockId;
  name: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  subcategories: string[];
};

type ListingQueryRow = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  photos: string[] | null;
  category: string | null;
  type: "item" | "service";
  sub_category: string | null;
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

type CountRow = {
  sub_category: string | null;
};

type AggregateCountRow = {
  sub_category: string | null;
  count: number | string | null;
};

const CATEGORY_BLOCKS: CategoryBlock[] = [
  {
    id: "items",
    name: "Items",
    description: "Clothing, shoes and more",
    iconBg: "#EEF2FF",
    icon: <ShoppingBag className="h-5 w-5 text-[#0039A6]" strokeWidth={1.8} />,
    subcategories: [
      "Clothing — Women",
      "Clothing — Men",
      "Clothing — Unisex",
      "Shoes — Women",
      "Shoes — Men",
      "Accessories",
      "Electronics",
      "Other Items"
    ]
  },
  {
    id: "books",
    name: "Books",
    description: "Textbooks and reading material",
    iconBg: "#EEFAF4",
    icon: <BookOpen className="h-5 w-5 text-[#2D9B6F]" strokeWidth={1.8} />,
    subcategories: ["Textbooks", "Course Readers", "General Reading"]
  },
  {
    id: "furniture",
    name: "Furniture",
    description: "Dorm and house essentials",
    iconBg: "#FFF4EF",
    icon: <Home className="h-5 w-5 text-[#FF6B35]" strokeWidth={1.8} />,
    subcategories: [
      "Seating",
      "Desks and Storage",
      "Lighting",
      "Decor",
      "Appliances",
      "Other Furniture"
    ]
  },
  {
    id: "services",
    name: "Services",
    description: "Photography, DJing and more",
    iconBg: "#FEF9EE",
    icon: <Sparkles className="h-5 w-5 text-[#F59E0B]" strokeWidth={1.8} />,
    subcategories: [
      "Photography",
      "Music and DJing",
      "Moving Help",
      "Fitness and Training",
      "Cleaning",
      "Other Services"
    ]
  }
];

function getProfileObject(row: ListingQueryRow) {
  if (!row.profiles) {
    return null;
  }
  return Array.isArray(row.profiles) ? row.profiles[0] ?? null : row.profiles;
}

function canonicalCategoryLabel(row: ListingQueryRow) {
  if (row.type === "service") {
    return "Services";
  }
  const category = row.category?.trim().toLowerCase() ?? "";
  if (category.includes("book") || category.includes("textbook") || category.includes("reader")) {
    return "Books";
  }
  return "Items";
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
    categoryLabel: canonicalCategoryLabel(row),
    typeLabel: row.type === "service" ? "Service" : "Item"
  };
}

function SkeletonCard() {
  return (
    <div className="h-full min-h-[238px] overflow-hidden rounded-[16px] border border-[#E5E5E5] bg-white p-0 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <div className="flex h-full flex-col">
        <div className="skeleton-shimmer aspect-square rounded-t-xl" />
        <div className="flex min-h-[88px] flex-col space-y-2 px-3 py-2.5">
          <div className="skeleton-shimmer h-[22px] w-16 rounded-full" />
          <div className="skeleton-shimmer h-3 rounded" />
          <div className="skeleton-shimmer h-3 w-4/5 rounded" />
          <div className="skeleton-shimmer mt-auto h-4 w-2/3 rounded" />
        </div>
      </div>
    </div>
  );
}

function CategoryBlockCard({
  block,
  counts,
  isOpen,
  selectedSubcategory,
  onToggle,
  onSelect
}: {
  block: CategoryBlock;
  counts: Record<string, number>;
  isOpen: boolean;
  selectedSubcategory: string | null;
  onToggle: () => void;
  onSelect: (subcategory: string) => void;
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border bg-white transition-colors duration-150 ${
        isOpen ? "border-[#0039A6]" : "border-[#E5E5E5]"
      }`}
      style={{ borderWidth: "0.5px" }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex min-h-[64px] w-full cursor-pointer items-center justify-between px-4 py-3.5 text-left"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: block.iconBg }}
          >
            {block.icon}
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] font-semibold text-[#1A1A1A]">{block.name}</span>
            <span className="block truncate text-xs text-[#9A9A9A]">{block.description}</span>
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#9A9A9A] transition-transform duration-200 ease-in-out ${
            isOpen ? "rotate-180" : ""
          }`}
          strokeWidth={2}
        />
      </button>

      {isOpen ? (
        <div className="border-t border-[#E5E5E5] py-2" style={{ borderTopWidth: "0.5px" }}>
          {block.subcategories.map((subcategory) => {
            const selected = selectedSubcategory === subcategory;
            return (
              <button
                key={subcategory}
                type="button"
                onClick={() => onSelect(subcategory)}
                className={`flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 px-4 py-2.5 pl-16 text-left text-sm ${
                  selected ? "font-semibold text-[#0039A6]" : "font-normal text-[#595959]"
                }`}
              >
                <span>{subcategory}</span>
                <span className="rounded-full bg-[#F5F5F5] px-2 py-0.5 text-[11px] font-medium text-[#9A9A9A]">
                  {counts[subcategory] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function MarketSearchPage() {
  const supabase = useMemo(() => createClient(), []);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const listingsSectionRef = useRef<HTMLDivElement | null>(null);

  const [openBlock, setOpenBlock] = useState<CategoryBlockId | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [results, setResults] = useState<MarketFeedItem[]>([]);
  const [isLoadingCounts, setIsLoadingCounts] = useState(true);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadCounts = async () => {
      setIsLoadingCounts(true);
      const { data, error: aggregateError } = await supabase
        .from("listings")
        .select("sub_category,count()")
        .eq("status", "active")
        .not("sub_category", "is", null);

      if (!isMounted) {
        return;
      }

      if (!aggregateError) {
        const nextCounts = ((data ?? []) as AggregateCountRow[]).reduce<Record<string, number>>(
          (accumulator, row) => {
            const subcategory = row.sub_category?.trim();
            if (subcategory) {
              accumulator[subcategory] = Number(row.count ?? 0);
            }
            return accumulator;
          },
          {}
        );

        setCounts(nextCounts);
        setIsLoadingCounts(false);
        return;
      }

      const { data: fallbackData, error: countsError } = await supabase
        .from("listings")
        .select("sub_category")
        .eq("status", "active")
        .not("sub_category", "is", null);

      if (!isMounted) {
        return;
      }

      if (countsError) {
        setError(countsError.message);
        setIsLoadingCounts(false);
        return;
      }

      const nextCounts = ((fallbackData ?? []) as CountRow[]).reduce<Record<string, number>>(
        (accumulator, row) => {
          const subcategory = row.sub_category?.trim();
          if (subcategory) {
            accumulator[subcategory] = (accumulator[subcategory] ?? 0) + 1;
          }
          return accumulator;
        },
        {}
      );

      setCounts(nextCounts);
      setIsLoadingCounts(false);
    };

    void loadCounts();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchInput]);

  const loadListings = useCallback(
    async (subcategory: string, query: string) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      setIsLoadingResults(true);
      setError(null);

      let builder = supabase
        .from("listings")
        .select(
          "id,title,description,price,photos,category,type,sub_category,created_at,seller_id,profiles!listings_seller_id_fkey(first_name,last_initial,average_rating,total_trades)"
        )
        .eq("status", "active")
        .eq("sub_category", subcategory)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      if (query) {
        const escaped = query.replace(/[%_,]/g, (match) => `\\${match}`);
        builder = builder.or(`title.ilike.%${escaped}%,description.ilike.%${escaped}%`);
      }

      const { data, error: listingsError } = await builder;

      if (requestIdRef.current !== requestId) {
        return;
      }

      if (listingsError) {
        setError(listingsError.message);
        setResults([]);
        setIsLoadingResults(false);
        return;
      }

      setResults(((data ?? []) as ListingQueryRow[]).map(toFeedItem));
      setIsLoadingResults(false);
    },
    [supabase]
  );

  useEffect(() => {
    if (!selectedSubcategory) {
      setResults([]);
      setIsLoadingResults(false);
      return;
    }

    void loadListings(selectedSubcategory, debouncedSearch);
  }, [debouncedSearch, loadListings, selectedSubcategory]);

  function scrollToListingsSection() {
    window.setTimeout(() => {
      listingsSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 100);
  }

  function handleToggleBlock(blockId: CategoryBlockId) {
    setOpenBlock((current) => (current === blockId ? null : blockId));
    scrollToListingsSection();
  }

  function handleSelectSubcategory(blockId: CategoryBlockId, subcategory: string) {
    setOpenBlock(blockId);
    setSelectedSubcategory(subcategory);
    scrollToListingsSection();
  }

  return (
    <div className="-mx-4 -my-3 min-h-[calc(100vh-60px)] overflow-x-hidden bg-[#F5F5F5] pb-[calc(env(safe-area-inset-bottom)+100px)]">
      <div className="border-b border-[#E5E5E5] bg-white px-5 pb-3 pt-4">
        <h1 className="text-lg font-semibold text-[#1A1A1A]">Market</h1>
      </div>

      <div className="mx-4 mb-2.5 mt-3.5 flex items-center gap-2 rounded-[10px] border border-[#E5E5E5] bg-white px-3.5 py-2.5" style={{ borderWidth: "0.5px" }}>
        <Search className="h-4 w-4 shrink-0 text-[#9A9A9A]" strokeWidth={2} />
        <input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search items, books, services..."
          className="min-h-6 w-full bg-transparent text-base text-[#1A1A1A] outline-none placeholder:text-[#9A9A9A]"
        />
      </div>

      <div className="flex flex-col gap-2.5 px-4 pt-1">
        {CATEGORY_BLOCKS.map((block) => (
          <CategoryBlockCard
            key={block.id}
            block={block}
            counts={counts}
            isOpen={openBlock === block.id}
            selectedSubcategory={selectedSubcategory}
            onToggle={() => handleToggleBlock(block.id)}
            onSelect={(subcategory) => handleSelectSubcategory(block.id, subcategory)}
          />
        ))}
      </div>

      <div ref={listingsSectionRef}>
        {!selectedSubcategory ? (
          <p className="mt-2 px-4 text-center text-[13px] text-[#9A9A9A]">
            {isLoadingCounts ? "Loading categories..." : "Tap a category to browse listings"}
          </p>
        ) : (
          <section>
          <p className="mx-4 mb-2 mt-4 text-[13px] text-[#9A9A9A]">
            {`${results.length} ${results.length === 1 ? "listing" : "listings"} in ${selectedSubcategory}`}
          </p>

          {error ? (
            <div className="mx-4 mb-3 rounded-xl border border-[color:rgba(255,107,53,0.24)] bg-[color:rgba(255,107,53,0.10)] px-3 py-2 text-sm text-[#FF6B35]">
              {error}
            </div>
          ) : null}

          {isLoadingResults ? (
            <div className="grid grid-cols-2 gap-3 px-4 pb-[100px]">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonCard key={`market-category-skeleton-${index}`} />
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 px-4 pb-[100px]">
              {results.map((item) => (
                <ListingFeedCard key={`${item.source}:${item.id}`} item={item} />
              ))}
            </div>
          ) : (
            <div className="mx-4 rounded-2xl bg-white px-5 py-8 text-center">
              <SearchX className="mx-auto h-8 w-8 text-[#E5E5E5]" strokeWidth={1.8} />
              <h2 className="mt-3 text-[15px] font-semibold text-[#1A1A1A]">
                {`No ${selectedSubcategory} listed yet`}
              </h2>
              <p className="mt-1 text-[13px] text-[#9A9A9A]">Be the first to list one</p>
              <Link
                href="/market/sell"
                className="mt-5 inline-flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[#0039A6] px-4 text-sm font-semibold text-white"
              >
                List Something →
              </Link>
            </div>
          )}
          </section>
        )}
      </div>
    </div>
  );
}

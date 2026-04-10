import { NextResponse, type NextRequest } from "next/server";

import { isDevPreviewEnabled } from "@/lib/dev-preview";
import { resolveSupabasePublicUrl } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";
import {
  canonicalCategoryLabel,
  matchesMainCategory,
  normalizeMainCategory,
  normalizeSearchQuery,
  normalizeSubcategory
} from "@/lib/market/filters";
import type { MarketFeedItem, MarketFeedResponse } from "@/lib/market/types";

type ListingRow = {
  id: string;
  seller_id: string;
  type: string;
  title: string;
  price: number;
  category: string | null;
  photos: string[] | null;
  created_at: string;
  description: string | null;
};

type ProfileRow = {
  id: string;
  first_name: string | null;
  average_rating: number | null;
  total_trades: number | null;
};

type CursorPayload = {
  t: string;
};

const DEFAULT_PAGE_SIZE = 18;
const MAX_PAGE_SIZE = 30;

function previewMarketResponse(main: ReturnType<typeof normalizeMainCategory>): MarketFeedResponse {
  const now = new Date().toISOString();
  const demoItems: MarketFeedItem[] = [
    {
      id: "preview-item-1",
      source: "listing",
      createdAt: now,
      href: "/market/preview-item-1",
      title: "Dorm Mini Fridge",
      price: 65,
      photoUrl: null,
      sellerFirstName: "Ari",
      sellerDisplayName: "Ari",
      rating: 4.9,
      totalTrades: 12,
      distanceLabel: "On campus",
      categoryLabel: "Items",
      typeLabel: "Item"
    },
    {
      id: "preview-service-1",
      source: "listing",
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      href: "/market/preview-service-1",
      title: "Dorm Deep Cleaning",
      price: 40,
      photoUrl: null,
      sellerFirstName: "Jules",
      sellerDisplayName: "Jules",
      rating: 4.8,
      totalTrades: 6,
      distanceLabel: "On campus",
      categoryLabel: "Services",
      typeLabel: "Service"
    },
    {
      id: "preview-book-1",
      source: "listing",
      createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      href: "/market/preview-book-1",
      title: "ECON 101 Textbook",
      price: 18,
      photoUrl: null,
      sellerFirstName: "Mina",
      sellerDisplayName: "Mina",
      rating: 5,
      totalTrades: 9,
      distanceLabel: "On campus",
      categoryLabel: "Books",
      typeLabel: "Item"
    }
  ];

  const filtered = demoItems.filter((item) => matchesMainCategory(main, item.categoryLabel, item.typeLabel));

  return { items: filtered, nextCursor: null };
}

function sanitizeSearchTerm(term: string) {
  return term.replace(/[%*,]/g, " ").trim();
}

function encodeCursor(payload: CursorPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodeCursor(cursor: string | null): CursorPayload | null {
  if (!cursor) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    if (parsed && typeof parsed.t === "string") {
      return { t: parsed.t };
    }
    return null;
  } catch {
    return null;
  }
}

function safeFirstPhoto(photos: string[] | null | undefined) {
  const first = photos?.[0];
  return resolveSupabasePublicUrl(first, "listing-photos");
}

function firstNameFromDisplay(name: string | null | undefined, fallback = "Student") {
  const first = (name ?? "").trim().split(/\s+/)[0];
  return first || fallback;
}

async function fetchListingsFeed(args: {
  supabase: ReturnType<typeof createClient>;
  main: ReturnType<typeof normalizeMainCategory>;
  search: string;
  subcategory: string | null;
  cursor: CursorPayload | null;
  limit: number;
  excludeSellerId?: string | null;
}) {
  const { supabase, main, search, subcategory, cursor, limit, excludeSellerId } = args;

  let query = supabase
    .from("listings")
    .select("id,seller_id,type,title,price,category,photos,created_at,description")
    .eq("status", "active")
    .in("type", ["item", "service"])
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (excludeSellerId) {
    query = query.neq("seller_id", excludeSellerId);
  }

  if (main === "items") {
    query = query.eq("type", "item").not("category", "ilike", "%book%");
  } else if (main === "books") {
    query = query.eq("type", "item").ilike("category", "%book%");
  } else if (main === "services") {
    query = query.eq("type", "service");
  }

  if (cursor?.t) {
    query = query.lt("created_at", cursor.t);
  }

  const safeSearch = sanitizeSearchTerm(search);
  if (safeSearch) {
    query = query.or(
      `title.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%,category.ilike.%${safeSearch}%`
    );
  }

  if (subcategory) {
    query = query.ilike("category", subcategory);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  const rows = (data ?? []) as ListingRow[];
  const pageRows = rows.slice(0, limit);
  const hasMore = rows.length > limit;

  const sellerIds = Array.from(new Set(pageRows.map((row) => row.seller_id)));

  const profilesResult = await (sellerIds.length
      ? supabase
        .from("profiles")
        .select("id,first_name,average_rating,total_trades")
        .in("id", sellerIds)
    : Promise.resolve({ data: [] as ProfileRow[], error: null }));

  if (profilesResult.error) {
    throw profilesResult.error;
  }

  const profileMap = new Map(
    ((profilesResult.data ?? []) as ProfileRow[]).map((profile) => [profile.id, profile])
  );

  const items: MarketFeedItem[] = pageRows.map((row) => {
    const profile = profileMap.get(row.seller_id);
    const sellerFirstName = firstNameFromDisplay(profile?.first_name, "Student");
    const rating =
      typeof profile?.average_rating === "number"
        ? Number(Number(profile.average_rating).toFixed(1))
        : null;
    const totalTrades = Number(profile?.total_trades ?? 0);

    return {
      id: row.id,
      source: "listing",
      createdAt: row.created_at,
      href: `/market/${row.id}`,
      title: row.title,
      price: Number(row.price ?? 0),
      photoUrl: safeFirstPhoto(row.photos),
      sellerFirstName,
      sellerDisplayName: sellerFirstName,
      rating,
      totalTrades,
      distanceLabel: "On campus",
      categoryLabel: canonicalCategoryLabel(row.category, row.type),
      typeLabel: row.type.charAt(0).toUpperCase() + row.type.slice(1)
    };
  });

  const nextCursor = hasMore
    ? encodeCursor({ t: pageRows[pageRows.length - 1]?.created_at ?? rows[limit - 1]!.created_at })
    : null;

  return { items, nextCursor };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const main = normalizeMainCategory(searchParams.get("main"));
    const search = normalizeSearchQuery(searchParams.get("q"));
    const subcategory = normalizeSubcategory(main, searchParams.get("sub"));
    const cursor = decodeCursor(searchParams.get("cursor"));
    const limitParam = Number(searchParams.get("limit"));
    const limit =
      Number.isFinite(limitParam) && limitParam > 0
        ? Math.min(Math.floor(limitParam), MAX_PAGE_SIZE)
        : DEFAULT_PAGE_SIZE;

    const supabase = createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user && isDevPreviewEnabled()) {
      return NextResponse.json(previewMarketResponse(main));
    }

    const result = await fetchListingsFeed({
      supabase,
      main,
      search,
      subcategory,
      cursor,
      limit,
      excludeSellerId: user?.id ?? null
    });

    const response: MarketFeedResponse = {
      items: result.items,
      nextCursor: result.nextCursor
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load market feed."
      },
      { status: 500 }
    );
  }
}

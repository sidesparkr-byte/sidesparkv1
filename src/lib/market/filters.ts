import type { MarketMainCategory } from "@/lib/market/types";

export const MAIN_CATEGORY_LABELS: Array<{
  value: MarketMainCategory;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "items", label: "Items" },
  { value: "books", label: "Books" },
  { value: "services", label: "Services" }
];

export const SUBCATEGORY_MAP: Partial<Record<MarketMainCategory, string[]>> = {};

const BOOK_KEYWORDS = ["book", "textbook", "reading", "reader", "novel"] as const;

export function canonicalCategoryLabel(
  rawCategory: string | null | undefined,
  type: string | null | undefined
) {
  const normalizedType = (type ?? "").toLowerCase();
  const normalizedCategory = (rawCategory ?? "").trim().toLowerCase();

  if (normalizedType === "service") {
    return "Services";
  }

  if (BOOK_KEYWORDS.some((keyword) => normalizedCategory.includes(keyword))) {
    return "Books";
  }

  return "Items";
}

export function matchesMainCategory(
  main: MarketMainCategory,
  rawCategory: string | null | undefined,
  type: string | null | undefined
) {
  if (main === "all") return true;

  const label = canonicalCategoryLabel(rawCategory, type).toLowerCase();
  return label === main;
}

export function normalizeMainCategory(
  value: string | null | undefined
): MarketMainCategory {
  const normalized = (value ?? "").toLowerCase();
  if (
    normalized === "items" ||
    normalized === "books" ||
    normalized === "services"
  ) {
    return normalized;
  }
  return "all";
}

export function normalizeSubcategory(
  main: MarketMainCategory,
  value: string | null | undefined
) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const options = SUBCATEGORY_MAP[main] ?? [];
  const match = options.find(
    (option) => option.toLowerCase() === trimmed.toLowerCase()
  );

  return match ?? null;
}

export function normalizeSearchQuery(value: string | null | undefined) {
  return (value ?? "").trim();
}

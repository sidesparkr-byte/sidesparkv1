export type MarketMainCategory =
  | "all"
  | "items"
  | "books"
  | "services";

export type MarketListingSource = "listing";

export type MarketFeedItem = {
  id: string;
  source: MarketListingSource;
  createdAt: string;
  href: string;
  title: string;
  price: number;
  photoUrl: string | null;
  sellerFirstName: string;
  sellerDisplayName: string;
  rating: number | null;
  totalTrades: number;
  distanceLabel: string;
  categoryLabel: string | null;
  typeLabel: string;
};

export type MarketFeedResponse = {
  items: MarketFeedItem[];
  nextCursor: string | null;
};

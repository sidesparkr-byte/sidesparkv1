import Link from "next/link";
import { notFound } from "next/navigation";
import { Info } from "lucide-react";

import { Avatar, Card } from "@/components/ui";
import { isDevPreviewEnabled } from "@/lib/dev-preview";
import { canonicalCategoryLabel } from "@/lib/market/filters";
import { resolveSupabasePhotoArray, resolveSupabasePublicUrl } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatListingTitle } from "@/lib/utils";

import { ListingStatusControls } from "@/app/(main)/market/[id]/listing-status-controls";
import { ListingDetailTopBar } from "@/app/(main)/market/[id]/listing-detail-top-bar";
import { ListingRealtimeRefresh } from "@/app/(main)/market/[id]/listing-realtime-refresh";
import { PhotoCarousel } from "@/app/(main)/market/[id]/photo-carousel";
import { BuyerQrScanButton } from "@/app/(main)/market/[id]/qr-scan-handshake";
import { RemoveListingButton } from "@/app/(main)/market/[id]/remove-listing-button";
import { SellerQrCodeButton } from "@/app/(main)/market/[id]/qr-handshake";
import { ReserveItemButton } from "@/app/(main)/market/[id]/reserve-item-button";

type ListingDetailRow = {
  id: string;
  seller_id: string;
  type: "item" | "service";
  status: "active" | "reserved" | "completed";
  title: string;
  description: string;
  price: number;
  category: string | null;
  condition: string | null;
  photos: string[] | null;
  availability: Record<string, unknown> | null;
  subjects: string[] | null;
  reserved_by: string | null;
  reserved_at: string | null;
  completed_at: string | null;
  created_at: string;
  profiles:
    | {
        id: string;
        first_name: string | null;
        last_initial: string | null;
        photo_url: string | null;
        average_rating?: number | null;
        total_ratings?: number | null;
        total_trades?: number | null;
      }
    | {
        id: string;
        first_name: string | null;
        last_initial: string | null;
        photo_url: string | null;
        average_rating?: number | null;
        total_ratings?: number | null;
        total_trades?: number | null;
      }[]
    | null;
};

type ConversationBuyerRow = {
  id: string;
  buyer_id: string;
};

type BuyerProfileRow = {
  id: string;
  first_name: string | null;
  last_initial: string | null;
};

type CompletedTransactionPromptRow = {
  id: string;
};

type ReservationOption = {
  buyerId: string;
  label: string;
};

function getProfileObject(row: ListingDetailRow) {
  const profile = row.profiles;
  if (!profile) {
    return null;
  }
  return Array.isArray(profile) ? profile[0] ?? null : profile;
}

function sellerDisplayName(firstName?: string | null, lastInitial?: string | null) {
  const first = (firstName ?? "").trim() || "Butler Student";
  const last = (lastInitial ?? "").trim();
  return `${first}${last ? ` ${last.toUpperCase()}.` : ""}`;
}

function toTitleCaseLabel(value: string) {
  return value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: unknown) {
  if (typeof value !== "string" || !value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function formatTimeAgo(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "recently";
  }

  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const thresholds: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 24 * 365],
    ["month", 60 * 24 * 30],
    ["week", 60 * 24 * 7],
    ["day", 60 * 24],
    ["hour", 60],
    ["minute", 1]
  ];

  for (const [unit, minutesPerUnit] of thresholds) {
    if (Math.abs(diffMinutes) >= minutesPerUnit || unit === "minute") {
      return rtf.format(Math.round(diffMinutes / minutesPerUnit), unit);
    }
  }

  return "recently";
}

function getAvailabilityValue(
  availability: Record<string, unknown> | null | undefined,
  ...keys: string[]
) {
  if (!availability) {
    return null;
  }
  for (const key of keys) {
    if (key in availability && availability[key] != null) {
      return availability[key];
    }
  }
  return null;
}

function renderAvailabilitySummary(availability: Record<string, unknown> | null) {
  if (!availability) {
    return "Flexible scheduling";
  }

  const label = getAvailabilityValue(availability, "label", "summary");
  if (typeof label === "string" && label.trim()) {
    return label;
  }

  const days = getAvailabilityValue(availability, "days");
  const time = getAvailabilityValue(availability, "time", "window");

  const parts: string[] = [];
  if (Array.isArray(days) && days.length > 0) {
    parts.push(days.map((d) => String(d)).join(", "));
  }
  if (typeof time === "string" && time.trim()) {
    parts.push(time);
  }

  return parts.length > 0 ? parts.join(" • ") : "Flexible scheduling";
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-[var(--color-surface)] px-3 py-2">
      <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
      <span className="text-right text-sm font-medium text-[var(--color-text-primary)]">{value}</span>
    </div>
  );
}

function DetailChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[116px] flex-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
        {label}
      </p>
      <p className="mt-1 text-[14px] font-semibold text-[var(--color-text-primary)]">{value}</p>
    </div>
  );
}

function categoryChipClasses(categoryLabel: string) {
  if (categoryLabel === "Books") {
    return "bg-[#EEFAF4] text-[#2D9B6F]";
  }
  if (categoryLabel === "Services") {
    return "bg-[#FFF4EF] text-[#FF6B35]";
  }
  return "bg-[#EEF2FF] text-[#0039A6]";
}

function HeroCategoryChip({ label }: { label: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${categoryChipClasses(label)}`}
    >
      {label}
    </span>
  );
}

function RatingStars({
  rating,
  totalTrades
}: {
  rating: number | null;
  totalTrades: number;
}) {
  if (typeof rating !== "number" || totalTrades <= 0) {
    return <p className="text-[12px] font-normal text-[#9A9A9A]">New to SideSpark ✦</p>;
  }

  const filledStars = Math.max(1, Math.min(5, Math.round(rating)));

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <svg
            key={`seller-rating-star-${index}`}
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill={index < filledStars ? "#F4B942" : "none"}
            aria-hidden="true"
          >
            <path
              d="m12 3.8 2.4 4.8 5.3.8-3.8 3.7.9 5.2-4.8-2.5-4.8 2.5.9-5.2-3.8-3.7 5.3-.8L12 3.8Z"
              stroke={index < filledStars ? "#F4B942" : "#E5E5E5"}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        ))}
      </div>
      <span className="text-sm text-[var(--color-text-secondary)]">
        {rating.toFixed(1)} ({totalTrades} {totalTrades === 1 ? "trade" : "trades"})
      </span>
    </div>
  );
}

type PageProps = {
  params: {
    id: string;
  };
};

type PreviewListing = {
  id: string;
  type: "item" | "service";
  status: "active" | "reserved" | "completed";
  title: string;
  description: string;
  price: number;
  category: string;
  badge?: string;
};

function getPreviewListing(id: string): PreviewListing | null {
  const data: Record<string, PreviewListing> = {
    "preview-item-1": {
      id,
      type: "item",
      status: "active",
      title: "Dorm Mini Fridge",
      description: "Compact mini fridge in good condition. Great for a dorm room and ready for pickup on campus.",
      price: 65,
      category: "Items",
      badge: "Good"
    },
    "preview-service-1": {
      id,
      type: "service",
      status: "active",
      title: "Dorm Deep Cleaning",
      description: "Deep clean for dorms and off-campus apartments. Flexible scheduling most afternoons.",
      price: 40,
      category: "Services"
    },
    "preview-book-1": {
      id,
      type: "item",
      status: "active",
      title: "ECON 101 Textbook",
      description: "Clean copy with light highlighting and all supplemental notes included.",
      price: 18,
      category: "Books"
    }
  };
  return data[id] ?? null;
}

function PreviewListingDetail({ listing }: { listing: PreviewListing }) {
  const postedAgo = "Posted today";

  return (
    <div className="space-y-5 overflow-x-hidden pb-[calc(124px+env(safe-area-inset-bottom))]">
      <div>
        <ListingDetailTopBar title={formatListingTitle(listing.title)} />

        <section className="-mx-4 overflow-hidden bg-[var(--color-background)]">
          <div className="relative">
            <PhotoCarousel photos={[]} title={listing.title} categoryLabel={listing.category} />
            <span className="pointer-events-none absolute left-4 top-4 inline-flex rounded-full bg-[#0039A6] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-white">
              Butler Verified
            </span>
          </div>
        </section>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <HeroCategoryChip label={listing.category} />
          <p className="text-xs text-[var(--color-text-muted)]">{postedAgo}</p>
        </div>
        <div className="space-y-2">
          <h1 className="font-heading text-[24px] font-bold leading-[1.1] text-[var(--color-text-primary)]">
            {formatListingTitle(listing.title)}
          </h1>
          <p className="text-[28px] font-bold leading-none text-[var(--color-text-primary)]">
            {formatCurrency(listing.price)}
          </p>
        </div>
        <div className="h-px w-full bg-[var(--color-border)]" />
        <div className="flex gap-3 overflow-x-auto pb-1">
          {listing.badge ? <DetailChip label="Condition" value={listing.badge} /> : null}
          <DetailChip label="Location" value="Butler Campus" />
        </div>
        <div className="h-px w-full bg-[var(--color-border)]" />
      </section>

      <section className="rounded-2xl bg-[var(--color-surface)] p-4">
        <div className="flex items-start gap-3">
          <Avatar name="Ari M." size="md" />
          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">Ari M.</p>
              <span className="shrink-0 rounded-full bg-[#0039A6] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-white">
                Verified Seller
              </span>
            </div>
            <DetailRow label="Response time" value="Usually within 1 hour" />
            <DetailRow label="Items Sold" value="12" />
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Description</h2>
        <p className="text-sm leading-[1.6] text-[var(--color-text-secondary)]">{listing.description}</p>
      </section>

      <div className="pointer-events-none sticky bottom-[calc(env(safe-area-inset-bottom)+76px)] z-20 -mx-4">
        <div className="pointer-events-auto border-t border-[var(--color-border)] bg-[color:rgba(255,255,255,0.98)] px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
          <Link
            href="/messages/preview"
            className="inline-flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(255,107,53,0.24)] transition hover:brightness-95"
          >
            Reserve Item
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function ListingDetailPage({ params }: PageProps) {
  const previewListing = isDevPreviewEnabled() ? getPreviewListing(params.id) : null;
  if (previewListing) {
    return <PreviewListingDetail listing={previewListing} />;
  }

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: listing, error } = await supabase
    .from("listings")
    .select(
      "id,seller_id,type,status,title,description,price,category,condition,photos,availability,subjects,reserved_by,reserved_at,completed_at,created_at,profiles!listings_seller_id_fkey(id,first_name,last_initial,photo_url,average_rating,total_ratings,total_trades)"
    )
    .eq("id", params.id)
    .maybeSingle<ListingDetailRow>();

  if (error) {
    notFound();
  }
  if (!listing) {
    notFound();
  }

  const sellerProfile = getProfileObject(listing);
  const sellerId = listing.seller_id;

  const [conversationBuyersResult] = await Promise.all([
    user?.id === sellerId
      ? supabase
          .from("conversations")
          .select("id,buyer_id")
          .eq("listing_id", listing.id)
          .eq("seller_id", sellerId)
      : Promise.resolve({ data: [], error: null })
  ]);
  const completedTransactionPromptResult =
    user?.id === sellerId && listing.status === "completed"
      ? await supabase
          .from("transactions")
          .select("id")
          .eq("listing_id", listing.id)
          .eq("status", "completed")
          .maybeSingle<CompletedTransactionPromptRow>()
      : { data: null, error: null };

  const avgRating =
    typeof sellerProfile?.average_rating === "number"
      ? Number(Number(sellerProfile.average_rating).toFixed(1))
      : null;
  const reviewCount = Number(sellerProfile?.total_ratings ?? 0);
  const completedTrades = Number(sellerProfile?.total_trades ?? 0);
  const buyerIds = Array.from(
    new Set(
      ((conversationBuyersResult.data ?? []) as ConversationBuyerRow[])
        .map((row) => row.buyer_id)
        .concat(listing.reserved_by ? [listing.reserved_by] : [])
    )
  );
  let reservationOptions: ReservationOption[] = [];

  if (buyerIds.length > 0) {
    const { data: buyerProfilesData } = await supabase
      .from("profiles")
      .select("id,first_name,last_initial")
      .in("id", buyerIds);

    reservationOptions = ((buyerProfilesData ?? []) as BuyerProfileRow[]).map((profile) => ({
      buyerId: profile.id,
      label: sellerDisplayName(profile.first_name, profile.last_initial)
    }));
  }

  const listingCategoryLabel = canonicalCategoryLabel(listing.category, listing.type);

  const conditionLabel =
    listing.type === "item" && listing.condition ? toTitleCaseLabel(listing.condition) : null;

  const sellerName = sellerDisplayName(
    sellerProfile?.first_name ?? null,
    sellerProfile?.last_initial ?? null
  );

  const photos = resolveSupabasePhotoArray(listing.photos, "listing-photos");

  const availability =
    listing.availability && typeof listing.availability === "object"
      ? (listing.availability as Record<string, unknown>)
      : null;

  const sellerProfileHref = `/profile?sellerId=${encodeURIComponent(sellerId)}`;
  const isOwner = user?.id === sellerId;
  const isReservedForViewer = !!user && listing.reserved_by === user.id;
  const reservedBuyer = reservationOptions.find((option) => option.buyerId === listing.reserved_by) ?? null;
  const reservedBuyerFirstName = reservedBuyer?.label.split(" ")[0] ?? null;
  const reservedAtLabel = formatDate(listing.reserved_at);
  const completedAtLabel = formatDate(listing.completed_at);
  const completedTransactionId = completedTransactionPromptResult.data?.id ?? null;
  let sellerHasRatedBuyer = false;

  if (isOwner && completedTransactionId) {
    const { data: existingSellerRating } = await supabase
      .from("ratings")
      .select("id")
      .eq("transaction_id", completedTransactionId)
      .eq("rater_id", sellerId)
      .maybeSingle();

    sellerHasRatedBuyer = Boolean(existingSellerRating);
  }
  const statusSummary =
    listing.status === "reserved"
      ? reservedAtLabel
        ? `Reserved on ${reservedAtLabel}`
        : "Reserved"
      : listing.status === "completed"
        ? completedAtLabel
          ? `Completed on ${completedAtLabel}`
          : "Completed"
        : "Active listing";
  const postedAgo = `Posted ${formatTimeAgo(listing.created_at)}`;
  const locationLabel = listing.type === "service" ? "Butler area" : "Butler Campus";
  const availabilityLabel = listing.type === "service" ? renderAvailabilitySummary(availability) : null;
  const sellerResponseTime = listing.type === "service" ? "Usually within 2 hours" : "Usually within 1 hour";
  const buyerReserveState =
    listing.status === "completed"
      ? "completed"
      : isReservedForViewer
        ? "reserved_by_you"
        : listing.status === "reserved"
          ? "reserved_other"
          : "available";

  return (
    <div className="space-y-5 overflow-x-hidden pb-[calc(132px+env(safe-area-inset-bottom))]">
      <ListingRealtimeRefresh listingId={listing.id} />
      <div>
        <ListingDetailTopBar title={formatListingTitle(listing.title)} />

        <section className="-mx-4 overflow-hidden bg-[var(--color-background)]">
          <div className="relative">
            <PhotoCarousel photos={photos} title={listing.title} categoryLabel={listingCategoryLabel} />
            <span className="pointer-events-none absolute left-4 top-4 inline-flex rounded-full bg-[#0039A6] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-white">
              Butler Verified
            </span>
          </div>
        </section>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <HeroCategoryChip label={listingCategoryLabel} />
          <p className="text-xs text-[var(--color-text-muted)]">{postedAgo}</p>
        </div>

        <div className="space-y-2">
          {isOwner && listing.status === "completed" && completedTransactionId && !sellerHasRatedBuyer ? (
            <Link
              href={`/rate/${completedTransactionId}`}
              className="flex items-center gap-3 rounded-xl border border-[#F4B942] bg-[#FFF8E7] px-4 py-3 text-sm font-medium text-[var(--color-text-primary)]"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-[#F4B942]" fill="currentColor" aria-hidden="true">
                <path d="m12 3.8 2.4 4.8 5.3.8-3.8 3.7.9 5.2-4.8-2.5-4.8 2.5.9-5.2-3.8-3.7 5.3-.8L12 3.8Z" />
              </svg>
              <span>Rate your buyer →</span>
            </Link>
          ) : null}
          <h1 className="font-heading text-[24px] font-bold leading-[1.1] text-[var(--color-text-primary)]">
            {formatListingTitle(listing.title)}
          </h1>
          <p className="text-[28px] font-bold leading-none text-[var(--color-text-primary)]">
            {formatCurrency(Number(listing.price))}
          </p>
          {isOwner && listing.status === "active" ? (
            <div className="flex items-center gap-2 rounded-[10px] border border-[#C7D7FD] bg-[#EEF2FF] px-3.5 py-2.5">
              <Info className="h-4 w-4 shrink-0 text-[#0039A6]" aria-hidden="true" strokeWidth={2} />
              <p className="text-[13px] leading-[1.4] text-[#0039A6]">
                When a buyer reserves this, a QR code will appear here to confirm pickup.
              </p>
            </div>
          ) : null}
          {isOwner && listing.status === "reserved" && reservedBuyerFirstName ? (
            <div className="inline-flex rounded-xl bg-[color:rgba(0,57,166,0.10)] px-3 py-2 text-sm font-medium text-[var(--color-primary)]">
              Reserved by {reservedBuyerFirstName}
            </div>
          ) : null}
        </div>
        <div className="h-px w-full bg-[var(--color-border)]" />
        <div className="app-scroll flex gap-3 overflow-x-auto pb-1">
          {conditionLabel ? <DetailChip label="Condition" value={conditionLabel} /> : null}
          <DetailChip label="Location" value={locationLabel} />
          {availabilityLabel ? <DetailChip label="Availability" value={availabilityLabel} /> : null}
        </div>
        <div className="h-px w-full bg-[var(--color-border)]" />
      </section>

      <Link href={sellerProfileHref} className="block">
        <section className="rounded-2xl bg-[var(--color-surface)] p-4">
          <div className="flex items-start gap-3">
            <Avatar
              src={resolveSupabasePublicUrl(sellerProfile?.photo_url ?? null, "avatars")}
              name={sellerName}
              alt={`${sellerName} avatar`}
              size="md"
            />
            <div className="min-w-0 flex-1 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{sellerName}</p>
                <span className="shrink-0 rounded-full bg-[#0039A6] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-white">
                  Verified Seller
                </span>
              </div>
              <div className="space-y-2">
                <DetailRow label="Response time" value={sellerResponseTime} />
                {completedTrades > 0 ? <DetailRow label="Items Sold" value={String(completedTrades)} /> : null}
                <div className="rounded-xl bg-[var(--color-surface)] px-3 py-2">
                  <p className="mb-1 text-sm text-[var(--color-text-secondary)]">Rating</p>
                  <RatingStars rating={avgRating} totalTrades={completedTrades} />
                </div>
              </div>
            </div>
          </div>
        </section>
      </Link>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Description</h2>
        <p className="whitespace-pre-wrap text-sm leading-[1.6] text-[var(--color-text-secondary)]">
          {listing.description || "No description provided."}
        </p>
      </section>

      {isOwner ? (
        <Card className="rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Listing Status</h2>
          <div className="mt-3 space-y-2">
            <DetailRow label="Status" value={statusSummary} />
            {listing.status === "reserved" && listing.reserved_by ? (
              <DetailRow label="Access" value="Reserved by a buyer" />
            ) : null}
          </div>
        </Card>
      ) : null}

      <div className="pointer-events-none sticky bottom-[calc(env(safe-area-inset-bottom)+76px)] z-20 -mx-4">
        <div className="pointer-events-auto border-t border-[var(--color-border)] bg-[color:rgba(255,255,255,0.98)] px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
          <div className="space-y-3">
            {isOwner ? (
              <>
                {listing.status === "completed" ? (
                  <p className="py-3 text-center text-sm font-semibold text-[var(--color-success)]">
                    Transaction Complete ✓
                  </p>
                ) : listing.status === "reserved" ? (
                  <>
                    <SellerQrCodeButton
                      listingId={listing.id}
                      reservedBuyerFirstName={reservedBuyerFirstName}
                    />
                    <ListingStatusControls
                      listingId={listing.id}
                      status={listing.status}
                      reservedBy={listing.reserved_by}
                      reservationOptions={reservationOptions}
                    />
                  </>
                ) : (
                  <>
                    <Link
                      href="/profile?tab=listings"
                      className="inline-flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(0,57,166,0.18)] transition hover:bg-[var(--color-primary-dark)]"
                    >
                      View Listed
                    </Link>
                    <ListingStatusControls
                      listingId={listing.id}
                      status={listing.status}
                      reservedBy={listing.reserved_by}
                      reservationOptions={reservationOptions}
                    />
                  </>
                )}
                <RemoveListingButton listingId={listing.id} status={listing.status} />
              </>
            ) : (
              <>
                {listing.status === "completed" ? (
                  <p className="py-3 text-center text-sm font-semibold text-[var(--color-success)]">
                    Transaction Complete ✓
                  </p>
                ) : (
                  <>
                    <ReserveItemButton
                      listingId={listing.id}
                      disabledState={buyerReserveState}
                    />
                    {listing.status === "active" ? (
                      <>
                        <p className="mt-2 text-center text-[12px] text-[#9A9A9A]">
                          Meet on campus · Pay at pickup
                        </p>
                        <Link
                          href={`/messages/start?listingId=${encodeURIComponent(listing.id)}`}
                          className="inline-flex min-h-[52px] w-full items-center justify-center rounded-xl border-2 border-[#0039A6] bg-white px-4 text-[15px] font-semibold text-[#0039A6]"
                        >
                          Message Seller
                        </Link>
                        <p className="mt-1.5 text-center text-[11px] text-[#9A9A9A]">
                          Free to use · No fees during beta
                        </p>
                      </>
                    ) : null}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

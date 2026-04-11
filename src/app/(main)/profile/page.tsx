import { redirect } from "next/navigation";

import { Avatar } from "@/components/ui";
import { isDevPreviewEnabled } from "@/lib/dev-preview";
import { canonicalCategoryLabel } from "@/lib/market/filters";
import { resolveSupabasePublicUrl } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";
import type { MarketFeedItem } from "@/lib/market/types";

import { ProfileTabs } from "@/app/(main)/profile/profile-tabs";

type ProfileRow = {
  first_name: string | null;
  last_initial: string | null;
  graduation_year: number | null;
  photo_url: string | null;
  bio: string | null;
  major: string | null;
  average_rating: number | null;
  total_trades: number | null;
  created_at: string | null;
};

type ActiveListingRow = {
  id: string;
  title: string;
  price: number;
  photos: string[] | null;
  category: string | null;
  type: "item" | "service";
  created_at: string;
};

type ReservedListingRow = {
  id: string;
  title: string;
  price: number;
  photos: string[] | null;
  category: string | null;
  type: "item" | "service";
  seller_id: string;
  reserved_at: string | null;
  profiles:
    | {
        first_name: string | null;
        last_initial: string | null;
      }
    | {
        first_name: string | null;
        last_initial: string | null;
      }[]
    | null;
};

type CompletedTransactionRow = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  status: string;
  completed_at: string | null;
  created_at: string;
  item_price: number;
  listings:
    | {
        title: string | null;
        photos: string[] | null;
      }
    | {
        title: string | null;
        photos: string[] | null;
      }[]
    | null;
};

type RatingRow = {
  id: string;
  stars: number;
  created_at: string;
  rater_id: string;
  transaction_id?: string;
  profiles:
    | {
        first_name: string | null;
        last_initial: string | null;
        photo_url: string | null;
      }
    | {
        first_name: string | null;
        last_initial: string | null;
        photo_url: string | null;
      }[]
    | null;
};

type AuthoredRatingRow = {
  transaction_id: string;
  stars: number;
};

function formatDisplayName(profile: ProfileRow | null) {
  const first = profile?.first_name?.trim();
  const lastInitial = profile?.last_initial?.trim();

  if (first) {
    return `${first}${lastInitial ? ` ${lastInitial}.` : ""}`;
  }

  return "Butler Student";
}

function formatMemberSince(value: string | null | undefined) {
  if (!value) {
    return "Member";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Member";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric"
  }).format(date);
}

function getJoinedObject<T>(value: T | T[] | null | undefined) {
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? value[0] ?? null : value;
}

function toMarketFeedItem(
  listing: ActiveListingRow,
  sellerFirstName: string,
  sellerDisplayName: string,
  averageRating: number | null,
  totalTrades: number
): MarketFeedItem {
  return {
    id: listing.id,
    source: "listing",
    createdAt: listing.created_at,
    href: `/market/${listing.id}`,
    title: listing.title,
    price: Number(listing.price),
    photoUrl: listing.photos?.[0] ?? null,
    sellerFirstName,
    sellerDisplayName,
    rating: averageRating,
    totalTrades,
    distanceLabel: "Butler Campus",
    categoryLabel: canonicalCategoryLabel(listing.category, listing.type),
    typeLabel: listing.type === "service" ? "Service" : "Item"
  };
}

function StatBlock({
  value,
  label
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="min-w-0 flex-1 text-center">
      <p className="text-[18px] font-bold leading-none text-[var(--color-text-primary)]">{value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
        {label}
      </p>
    </div>
  );
}

function PreviewProfile() {
  return (
    <div className="space-y-5 pb-4">
      <section className="space-y-4 text-center">
        <Avatar
          name="Preview Student"
          size="lg"
          className="mx-auto h-[72px] w-[72px] border-[3px] border-[#0039A6] ring-0"
        />
        <div className="space-y-1">
          <h1 className="font-heading text-[20px] font-bold text-[var(--color-text-primary)]">
            Preview Student
          </h1>
          <p className="text-[13px] text-[var(--color-text-muted)]">Class of 2027 • Computer Science</p>
        </div>
        <div className="flex justify-center">
          <span className="inline-flex rounded-full bg-[#0039A6] px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-white">
            Butler Verified
          </span>
        </div>
        <div className="flex items-start justify-center gap-4">
          <StatBlock value="0" label="Trades" />
          <StatBlock value="New" label="Rating" />
          <StatBlock value="April 2026" label="Member" />
        </div>
        <p className="mx-auto max-w-[32ch] text-[14px] leading-[1.6] text-[var(--color-text-secondary)]">
          Sign in to load your real Butler profile, trust stats, and active listings.
        </p>
      </section>
      <ProfileTabs
        currentUserId=""
        isPreview
        bio="Sign in to load your real Butler profile, trust stats, and active listings."
        activeListings={[]}
        reservedListings={[]}
        completedTransactions={[]}
        ratings={[]}
      />
    </div>
  );
}

export default async function ProfilePage({
  searchParams
}: {
  searchParams?: { tab?: string };
}) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    if (!isDevPreviewEnabled()) {
      redirect("/login");
    }

    return <PreviewProfile />;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name,last_initial,graduation_year,photo_url,bio,major,average_rating,total_trades,created_at")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  const [activeListingsResult, reservedListingsResult, completedTransactionsResult, ratingsResult, authoredRatingsResult] =
    await Promise.all([
      supabase
        .from("listings")
        .select("id,title,price,photos,category,type,created_at")
        .eq("seller_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false }),
      supabase
        .from("listings")
        .select("id,title,price,photos,category,type,seller_id,reserved_at,profiles!listings_seller_id_fkey(first_name,last_initial)")
        .eq("reserved_by", user.id)
        .eq("status", "reserved")
        .order("reserved_at", { ascending: false }),
      supabase
        .from("transactions")
        .select("id,listing_id,buyer_id,seller_id,status,completed_at,created_at,item_price,listings(title,photos)")
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .eq("status", "completed")
        .order("completed_at", { ascending: false }),
      supabase
        .from("ratings")
        .select("id,stars,created_at,rater_id,transaction_id,profiles!ratings_rater_id_fkey(first_name,last_initial,photo_url)")
        .eq("rated_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("ratings")
        .select("transaction_id,stars")
        .eq("rater_id", user.id)
    ]);

  const displayName = formatDisplayName(profile ?? null);
  const sellerFirstName = profile?.first_name?.trim() || "You";
  const avatarName = profile?.first_name?.trim() || "Butler Student";
  const major = profile?.major?.trim() || null;
  const bio = profile?.bio?.trim() || null;
  const gradYear = profile?.graduation_year ?? null;
  const profileSubtitle = major && gradYear ? `${major} · ${gradYear}` : "Butler Student";
  const averageRating =
    typeof profile?.average_rating === "number"
      ? Number(Number(profile.average_rating).toFixed(1))
      : null;
  const totalTrades = Number(profile?.total_trades ?? 0);
  const memberSince = formatMemberSince(profile?.created_at ?? user.created_at ?? null);
  const activeListings = ((activeListingsResult.data ?? []) as ActiveListingRow[]).map((listing) =>
    toMarketFeedItem(listing, sellerFirstName, displayName, averageRating, totalTrades)
  );
  const reservedListings = ((reservedListingsResult.data ?? []) as ReservedListingRow[]).map((listing) => ({
    ...listing,
    sellerProfile: getJoinedObject(listing.profiles)
  }));
  const authoredRatingsByTransactionId = new Map(
    ((authoredRatingsResult.data ?? []) as AuthoredRatingRow[]).map((rating) => [rating.transaction_id, rating.stars])
  );
  const completedTransactions = ((completedTransactionsResult.data ?? []) as CompletedTransactionRow[]).map(
    (transaction) => ({
      ...transaction,
      listing: getJoinedObject(transaction.listings),
      submittedRating: authoredRatingsByTransactionId.get(transaction.id) ?? null
    })
  );
  const ratings = ((ratingsResult.data ?? []) as RatingRow[]).map((rating) => ({
    ...rating,
    raterProfile: getJoinedObject(rating.profiles)
  }));
  const initialTab =
    searchParams?.tab === "about" || searchParams?.tab === "activity" || searchParams?.tab === "listings"
      ? searchParams.tab
      : "listings";

  return (
    <div className="space-y-5 pb-4">
      <section className="space-y-4 text-center">
        <Avatar
          src={resolveSupabasePublicUrl(profile?.photo_url ?? null, "avatars")}
          name={avatarName}
          alt={`${displayName} profile photo`}
          size="lg"
          className="mx-auto h-[72px] w-[72px] border-[3px] border-[#0039A6] ring-0"
        />

        <div className="space-y-1">
          <h1 className="font-heading text-[20px] font-bold text-[var(--color-text-primary)]">
            {displayName}
          </h1>
          <p className="text-[13px] text-[var(--color-text-muted)]">
            {profileSubtitle}
          </p>
        </div>
        <div className="flex justify-center">
          <span className="inline-flex rounded-full bg-[#0039A6] px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-white">
            Butler Verified
          </span>
        </div>

        <div className="flex items-start justify-center gap-4">
          <StatBlock value={String(totalTrades)} label="Trades" />
          <StatBlock value={totalTrades > 0 && averageRating ? `⭐ ${averageRating.toFixed(1)}` : "New"} label="Rating" />
          <StatBlock value={memberSince} label="Member" />
        </div>
        {bio ? (
          <p className="mx-auto line-clamp-3 max-w-[32ch] text-[14px] leading-[1.6] text-[var(--color-text-secondary)]">
            {bio}
          </p>
        ) : null}

      </section>
      <ProfileTabs
        currentUserId={user.id}
        initialTab={initialTab}
        bio={bio}
        activeListings={activeListings}
        reservedListings={reservedListings}
        completedTransactions={completedTransactions}
        ratings={ratings}
      />
    </div>
  );
}

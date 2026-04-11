"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";

import { Avatar, Card, useToast } from "@/components/ui";
import { ListingFeedCard } from "@/components/market/listing-feed-card";
import type { MarketFeedItem } from "@/lib/market/types";
import { resolveSupabasePublicUrl } from "@/lib/media";
import { formatCurrency } from "@/lib/utils";

import { SignOutButton } from "@/app/(main)/profile/sign-out-button";

type ProfileTabsProps = {
  currentUserId: string;
  isPreview?: boolean;
  initialTab?: "about" | "listings" | "activity";
  bio: string | null;
  activeListings: MarketFeedItem[];
  reservedListings: Array<{
    id: string;
    title: string;
    price: number;
    photos: string[] | null;
    reserved_at: string | null;
    sellerProfile: {
      first_name: string | null;
      last_initial: string | null;
    } | null;
  }>;
  completedTransactions: Array<{
    id: string;
    listing_id: string;
    buyer_id: string;
    seller_id: string;
    completed_at: string | null;
    created_at: string;
    item_price: number;
    listing: {
      title: string | null;
      photos: string[] | null;
    } | null;
    submittedRating?: number | null;
  }>;
  ratings: Array<{
    id: string;
    stars: number;
    created_at: string;
    raterProfile: {
      first_name: string | null;
      last_initial: string | null;
      photo_url: string | null;
    } | null;
  }>;
};

const TABS = [
  { id: "about", label: "About" },
  { id: "listings", label: "Listings" },
  { id: "activity", label: "Activity" }
] as const;

type TabId = (typeof TABS)[number]["id"];

function PillTab({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "h-9 rounded-full bg-[#0039A6] px-4 text-[13px] font-semibold text-white transition-colors duration-150 ease-in-out"
          : "h-9 rounded-full bg-[#F5F5F5] px-4 text-[13px] font-semibold text-[#6B6B6B] transition-colors duration-150 ease-in-out"
      }
    >
      {label}
    </button>
  );
}

function formatShortDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(date);
}

function profileName(profile?: { first_name: string | null; last_initial: string | null } | null) {
  const first = profile?.first_name?.trim() || "Butler Student";
  const lastInitial = profile?.last_initial?.trim();
  return `${first}${lastInitial ? ` ${lastInitial.toUpperCase()}.` : ""}`;
}

function SettingLinkRow({
  label,
  href
}: {
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-[52px] w-full items-center justify-between gap-3 border-b border-[var(--color-border)] px-1 py-3 text-left"
    >
      <span className="text-base font-medium text-[var(--color-text-primary)]">{label}</span>
      <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" strokeWidth={1.9} />
    </Link>
  );
}

function SettingButtonRow({
  label,
  onClick
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[52px] w-full items-center justify-between gap-3 border-b border-[var(--color-border)] px-1 py-3 text-left"
    >
      <span className="text-base font-medium text-[var(--color-text-primary)]">{label}</span>
      <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" strokeWidth={1.9} />
    </button>
  );
}

function SectionHeading({ title }: { title: string }) {
  return <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">{title}</h2>;
}

export function ProfileTabs({
  currentUserId,
  isPreview = false,
  initialTab = "listings",
  bio,
  activeListings,
  reservedListings,
  completedTransactions,
  ratings
}: ProfileTabsProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {TABS.map((tab) => (
          <PillTab
            key={tab.id}
            label={tab.label}
            active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
      </div>

      {activeTab === "about" ? (
        <div className="space-y-4">
          <Card className="rounded-2xl p-4 shadow-none">
            <p className="text-[15px] leading-[1.7] text-[var(--color-text-secondary)]">
              {bio || "No bio yet"}
            </p>
          </Card>

          {!isPreview ? (
            <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <SettingLinkRow label="Edit Profile" href="/profile/edit" />
              <SettingButtonRow
                label="Help"
                onClick={() => showToast("Coming soon", { title: "Help" })}
              />
              <SignOutButton mode="row" className="border-b-0" />
            </section>
          ) : null}
        </div>
      ) : null}

      {activeTab === "listings" ? (
        <section className="space-y-3">
          <SectionHeading title="Active Listings" />
          {activeListings.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {activeListings.map((listing) => (
                <ListingFeedCard key={`profile-listing-${listing.id}`} item={listing} />
              ))}
            </div>
          ) : (
            <Card className="space-y-4 rounded-2xl p-5 text-center">
              <div>
                <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                  You haven&apos;t listed anything yet
                </h3>
              </div>
              <Link
                href="/market/sell"
                className="inline-flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-semibold text-white"
              >
                List Something →
              </Link>
            </Card>
          )}
        </section>
      ) : null}

      {activeTab === "activity" ? (
        <section className="space-y-4">
          <div className="space-y-2">
            <SectionHeading title="Reserved Items" />
            {reservedListings.length > 0 ? (
              <div className="app-scroll -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
                {reservedListings.map((listing) => {
                  const firstPhoto = resolveSupabasePublicUrl(listing.photos?.[0] ?? null, "listing-photos");
                  return (
                    <Link
                      key={`reserved-${listing.id}`}
                      href={`/market/${listing.id}`}
                      className="block w-[220px] shrink-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 shadow-[0_6px_18px_rgba(26,26,26,0.05)]"
                    >
                      <div className="flex gap-3">
                        <div className="h-[60px] w-[60px] shrink-0 overflow-hidden rounded-lg bg-[var(--color-surface)]">
                          {firstPhoto ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={firstPhoto} alt={listing.title} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-sm font-semibold text-[var(--color-text-primary)]">
                            {listing.title}
                          </p>
                          <p className="mt-1 text-sm font-bold text-[var(--color-text-primary)]">
                            {formatCurrency(Number(listing.price))}
                          </p>
                          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                            Reserved {formatShortDate(listing.reserved_at) ?? "recently"}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-secondary)]">Nothing reserved yet</p>
            )}
          </div>

          <div className="space-y-2">
            <SectionHeading title="Completed Trades" />
            {completedTransactions.length > 0 ? (
              <div className="space-y-3">
                {completedTransactions.map((transaction) => {
                  const firstPhoto = resolveSupabasePublicUrl(transaction.listing?.photos?.[0] ?? null, "listing-photos");
                  const role = transaction.buyer_id === currentUserId ? "Bought" : "Sold";
                  return (
                    <div
                      key={`completed-${transaction.id}`}
                      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 shadow-[0_6px_18px_rgba(26,26,26,0.05)]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-[var(--color-surface)]">
                          {firstPhoto ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={firstPhoto} alt={transaction.listing?.title ?? "Completed listing"} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-sm font-semibold text-[var(--color-text-primary)]">
                            {transaction.listing?.title ?? "Completed listing"}
                          </p>
                          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                            {role} · {formatShortDate(transaction.completed_at ?? transaction.created_at) ?? "recently"}
                          </p>
                        </div>
                        {typeof transaction.submittedRating === "number" ? (
                          <span className="shrink-0 text-sm font-semibold text-[#F4B942]">
                            {transaction.submittedRating}⭐
                          </span>
                        ) : (
                          <Link
                            href={`/rate/${transaction.id}`}
                            className="shrink-0 text-sm font-semibold text-[var(--color-primary)]"
                          >
                            Rate →
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-secondary)]">No completed trades yet</p>
            )}
          </div>

          <div className="space-y-2">
            <SectionHeading title="Ratings Received" />
            {ratings.length > 0 ? (
              <div className="space-y-3">
                {ratings.map((rating) => (
                  <div
                    key={`rating-${rating.id}`}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 shadow-[0_6px_18px_rgba(26,26,26,0.05)]"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={resolveSupabasePublicUrl(rating.raterProfile?.photo_url ?? null, "avatars")}
                        name={profileName(rating.raterProfile)}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                          {profileName(rating.raterProfile)}
                        </p>
                        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                          {formatShortDate(rating.created_at) ?? "Recent"}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5 text-[#F4B942]">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={`rating-star-${rating.id}-${index}`}
                            className="h-3.5 w-3.5"
                            fill={index < rating.stars ? "currentColor" : "none"}
                            strokeWidth={1.9}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-secondary)]">
                No ratings yet · Complete a trade to get rated
              </p>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}

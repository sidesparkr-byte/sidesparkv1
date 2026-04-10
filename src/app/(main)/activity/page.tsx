import Link from "next/link";

import { Badge, Card, PlaceholderCard } from "@/components/ui";
import { canonicalCategoryLabel } from "@/lib/market/filters";
import { resolveSupabasePublicUrl } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

type MyListingRow = {
  id: string;
  title: string;
  type: "item" | "service";
  price: number;
  status: "active" | "reserved" | "completed";
  created_at: string;
  photos: string[] | null;
  category: string | null;
  reserved_at: string | null;
  completed_at: string | null;
};

function formatShortDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function listingTypeLabel(type: MyListingRow["type"]) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function ListingRow({ listing }: { listing: MyListingRow }) {
  const createdLabel = formatShortDate(listing.created_at);
  const reservedLabel = formatShortDate(listing.reserved_at);
  const completedLabel = formatShortDate(listing.completed_at);
  const firstPhoto = resolveSupabasePublicUrl(listing.photos?.[0] ?? null, "listing-photos");
  const statusVariant =
    listing.status === "active"
      ? "success"
      : listing.status === "reserved"
        ? "warning"
        : "neutral";
  const statusLabel =
    listing.status === "reserved"
      ? reservedLabel
        ? `Reserved ${reservedLabel}`
        : "Reserved"
      : listing.status === "completed"
        ? completedLabel
          ? `Completed ${completedLabel}`
          : "Completed"
        : "Active";

  return (
    <Link
      href={`/market/${listing.id}`}
      className="block rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 shadow-[0_8px_24px_rgba(26,26,26,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(26,26,26,0.08)]"
    >
      <div className="flex gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[var(--color-surface)]">
          {firstPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={firstPhoto}
              alt={listing.title}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[var(--color-text-muted)]">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z" />
                <path d="m6.5 15 3-3 2.5 2.5 3.5-4 2 2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-2 text-sm font-semibold text-[var(--color-text-primary)]">{listing.title}</p>
            <span className="shrink-0 text-sm font-semibold text-[var(--color-primary)]">
              {formatCurrency(Number(listing.price))}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="neutral">{listingTypeLabel(listing.type)}</Badge>
            <Badge variant="info">{canonicalCategoryLabel(listing.category, listing.type)}</Badge>
            <Badge variant={statusVariant}>
              {statusLabel}
            </Badge>
          </div>

          <div className="mt-2 text-xs text-[var(--color-text-secondary)]">
            {createdLabel ? `Listed ${createdLabel}` : "Open listing"}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default async function ActivityPage({
  searchParams
}: {
  searchParams?: { tab?: string };
}) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let myListings: MyListingRow[] = [];
  const activeTab = searchParams?.tab === "listed" ? "listed" : "buying";

  if (user) {
    const { data: myListingsData } = await supabase
      .from("listings")
      .select("id,title,type,price,status,created_at,photos,category,reserved_at,completed_at")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false });

    myListings = (myListingsData ?? []) as MyListingRow[];
  }

  const activeListings = myListings.filter((listing) => listing.status === "active");
  const reservedListings = myListings.filter((listing) => listing.status === "reserved");
  const pastListings = myListings.filter((listing) => listing.status === "completed");

  return (
    <div className="space-y-4 pb-2">
      <section>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
          Activity
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Track messages, buying requests, and completed actions.
        </p>
      </section>

      <PlaceholderCard title="Messages" subtitle="Open your conversations with buyers and sellers">
        <Link
          href="/messages"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(0,57,166,0.16)]"
        >
          View Messages
        </Link>
      </PlaceholderCard>

      <section className="space-y-3">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-1 shadow-[0_8px_24px_rgba(26,26,26,0.04)]">
          <div className="grid grid-cols-2 gap-1">
            <Link
              href="/activity?tab=buying"
              className={`inline-flex min-h-11 items-center justify-center rounded-xl text-sm font-medium transition ${
                activeTab === "buying"
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
              }`}
            >
              Buying
            </Link>
            <Link
              href="/activity?tab=listed"
              className={`inline-flex min-h-11 items-center justify-center rounded-xl text-sm font-medium transition ${
                activeTab === "listed"
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
              }`}
            >
              Listed
            </Link>
          </div>
        </div>
      </section>

      {activeTab === "buying" ? (
        <section className="space-y-3">
          <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Buying</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">Use messages to coordinate purchases and offers.</p>
          </div>

          <Card className="flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-2xl border-dashed text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface)] text-[var(--color-text-secondary)]">
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path d="M6.5 7h11A2.5 2.5 0 0 1 20 9.5v7A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-7A2.5 2.5 0 0 1 6.5 7Z" />
                <path d="M8 11h8M8 14h5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-[var(--color-text-primary)]">Buyer activity lives in Messages</p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Open your conversations to follow up on listings, negotiate details, and confirm next steps.
              </p>
            </div>
            <Link
              href="/messages"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(0,57,166,0.16)]"
            >
              Open Messages
            </Link>
          </Card>
        </section>
      ) : (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Listed</h2>
              <p className="text-sm text-[var(--color-text-secondary)]">Your active and past listings</p>
            </div>
            <Link
              href="/market/sell"
              className="inline-flex min-h-11 items-center text-sm font-medium text-[var(--color-primary)]"
            >
              Sell something
            </Link>
          </div>

          {myListings.length === 0 ? (
            <Card className="flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-2xl border-dashed text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface)] text-[var(--color-text-secondary)]">
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path d="M5 8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V8Z" />
                  <path d="M8 12h8M12 8v8" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold text-[var(--color-text-primary)]">No listings yet</p>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  Post an item, book, or service offer to start getting messages.
                </p>
              </div>
              <Link
                href="/market/sell"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(0,57,166,0.16)]"
              >
                Create a listing
              </Link>
            </Card>
          ) : (
            <>
              <div className="space-y-2">
                {activeListings.length > 0 ? (
                  activeListings.map((listing) => <ListingRow key={listing.id} listing={listing} />)
                ) : (
                  <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-background)] px-4 py-5 text-center text-sm text-[var(--color-text-secondary)]">
                    No active listings.
                  </div>
                )}
              </div>

              <details className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 shadow-[0_8px_24px_rgba(26,26,26,0.04)]" open={reservedListings.length > 0}>
                <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--color-text-primary)]">
                  <div className="flex items-center justify-between gap-3">
                    <span>Reserved Listings</span>
                    <span className="text-xs font-medium text-[var(--color-text-secondary)]">{reservedListings.length}</span>
                  </div>
                </summary>
                <div className="mt-3 space-y-2">
                  {reservedListings.length > 0 ? (
                    reservedListings.map((listing) => <ListingRow key={listing.id} listing={listing} />)
                  ) : (
                    <p className="text-sm text-[var(--color-text-secondary)]">No reserved listings.</p>
                  )}
                </div>
              </details>

              <details className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 shadow-[0_8px_24px_rgba(26,26,26,0.04)]" open={pastListings.length > 0}>
                <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--color-text-primary)]">
                  <div className="flex items-center justify-between gap-3">
                    <span>Past Listings</span>
                    <span className="text-xs font-medium text-[var(--color-text-secondary)]">{pastListings.length}</span>
                  </div>
                </summary>
                <div className="mt-3 space-y-2">
                  {pastListings.length > 0 ? (
                    pastListings.map((listing) => <ListingRow key={listing.id} listing={listing} />)
                  ) : (
                    <p className="text-sm text-[var(--color-text-secondary)]">No past listings yet.</p>
                  )}
                </div>
              </details>
            </>
          )}
        </section>
      )}

      <PlaceholderCard title="Recent events">
        <ul className="space-y-3">
          {[
            ["Offer accepted", "Your mini fridge listing received a confirmed pickup", "2m"],
            ["ID verified", "A new buyer passed school email verification", "18m"],
            ["Payout queued", "Stripe transfer placeholder for completed sale", "1h"]
          ].map(([title, body, time]) => (
            <li key={title} className="flex gap-3 rounded-xl border border-neutral-200 p-3">
              <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</p>
                  <span className="text-xs text-[var(--color-text-muted)]">{time}</span>
                </div>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </PlaceholderCard>
    </div>
  );
}

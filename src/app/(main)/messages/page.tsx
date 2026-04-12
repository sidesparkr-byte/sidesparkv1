import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";

import { Avatar, Badge, Card } from "@/components/ui";
import { isDevPreviewEnabled } from "@/lib/dev-preview";
import { resolveSupabasePublicUrl } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatListingTitle } from "@/lib/utils";

type ConversationRow = {
  id: string;
  listing_id: string | null;
  buyer_id: string;
  seller_id: string;
  created_at: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type ListingRow = {
  id: string;
  title: string;
  price: number;
  photos: string[] | null;
};

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_initial: string | null;
  photo_url: string | null;
};

function otherPersonName(profile?: ProfileRow | null) {
  const first = profile?.first_name?.trim() || "Butler Student";
  const last = profile?.last_initial?.trim();
  return `${first}${last ? ` ${last.toUpperCase()}.` : ""}`;
}

function formatListTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit"
    }).format(date);
  }
  const diffDays = Math.floor(
    (new Date(now.toDateString()).getTime() - new Date(date.toDateString()).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  if (diffDays < 7) {
    return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(date);
}

export default async function MessagesPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    if (!isDevPreviewEnabled()) {
      redirect("/login");
    }

    return (
      <div className="space-y-4 pb-2">
        <section className="space-y-1">
          <h1 className="text-[18px] font-semibold text-[#1A1A1A]">Messages</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Preview mode. Sign in to open real conversations with buyers, sellers, and co-founders.
          </p>
        </section>
        <Link href="/messages/preview" className="block">
          <Card className="rounded-2xl p-4">
            <div className="flex gap-3">
            <Avatar name="Ari M." size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">Ari M.</p>
                <span className="text-xs text-[var(--color-text-muted)]">2:14 PM</span>
              </div>
              <div className="mt-2 rounded-xl bg-[var(--color-surface)] px-2 py-2">
                <p className="truncate text-xs font-medium text-[var(--color-text-secondary)]">Dorm Mini Fridge</p>
                <p className="text-xs text-[var(--color-text-muted)]">$65.00</p>
              </div>
              <p className="mt-2 truncate text-sm text-[var(--color-text-secondary)]">
                Is this still available?
              </p>
            </div>
            </div>
          </Card>
        </Link>
      </div>
    );
  }

  const { data: conversations, error: conversationError } = await supabase
    .from("conversations")
    .select("id,listing_id,buyer_id,seller_id,created_at")
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

  if (conversationError) {
    return (
      <div className="space-y-4 pb-2">
          <h1 className="text-[18px] font-semibold text-[#1A1A1A]">Messages</h1>
        <Card className="rounded-2xl border-[color:rgba(255,107,53,0.24)] bg-[color:rgba(255,107,53,0.10)] p-4 text-sm text-[var(--color-accent)]">
          {conversationError.message}
        </Card>
      </div>
    );
  }

  const conversationRows = (conversations ?? []) as ConversationRow[];

  if (conversationRows.length === 0) {
    return (
      <div className="space-y-3 pb-2">
        <h1 className="text-[18px] font-semibold text-[#1A1A1A]">Messages</h1>
        <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
          <MessageCircle className="h-10 w-10 text-[#E5E5E5]" strokeWidth={1.8} aria-hidden="true" />
          <h2 className="mt-3 text-[16px] font-semibold text-[#1A1A1A]">No conversations yet</h2>
          <p className="mt-1 text-[13px] text-[#9A9A9A]">Reserve an item to start chatting</p>
        </div>
      </div>
    );
  }

  const conversationIds = conversationRows.map((conversation) => conversation.id);
  const listingIds = Array.from(
    new Set(
      conversationRows
        .map((conversation) => conversation.listing_id)
        .filter((value): value is string => Boolean(value))
    )
  );
  const otherUserIds = Array.from(
    new Set(
      conversationRows.map((conversation) =>
        conversation.buyer_id === user.id ? conversation.seller_id : conversation.buyer_id
      )
    )
  );

  const [messagesResult, listingsResult, profilesResult] = await Promise.all([
    supabase
      .from("messages")
      .select("id,conversation_id,sender_id,content,created_at")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false }),
    listingIds.length > 0
      ? supabase
          .from("listings")
          .select("id,title,price,photos")
          .in("id", listingIds)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("profiles")
      .select("id,first_name,last_initial,photo_url")
      .in("id", otherUserIds)
  ]);

  const messageRows = ((messagesResult.data ?? []) as MessageRow[]) ?? [];
  const listingRows = ((listingsResult.data ?? []) as ListingRow[]) ?? [];
  const profileRows = ((profilesResult.data ?? []) as ProfileRow[]) ?? [];

  const latestMessageByConversation = new Map<string, MessageRow>();
  for (const message of messageRows) {
    if (!latestMessageByConversation.has(message.conversation_id)) {
      latestMessageByConversation.set(message.conversation_id, message);
    }
  }

  const listingMap = new Map(listingRows.map((listing) => [listing.id, listing]));
  const profileMap = new Map(profileRows.map((profile) => [profile.id, profile]));

  const sortedConversations = [...conversationRows].sort((a, b) => {
    const aLatest = latestMessageByConversation.get(a.id)?.created_at ?? a.created_at;
    const bLatest = latestMessageByConversation.get(b.id)?.created_at ?? b.created_at;
    return bLatest.localeCompare(aLatest);
  });

  return (
    <div className="space-y-3 pb-2">
      <h1 className="text-[18px] font-semibold text-[#1A1A1A]">Messages</h1>

      <div className="space-y-3">
        {sortedConversations.map((conversation) => {
          const otherId =
            conversation.buyer_id === user.id ? conversation.seller_id : conversation.buyer_id;
          const otherProfile = profileMap.get(otherId);
          const listing = conversation.listing_id
            ? listingMap.get(conversation.listing_id)
            : undefined;
          const listingPhoto = resolveSupabasePublicUrl(
            listing?.photos?.[0] ?? null,
            "listing-photos"
          );
          const listingTitle = listing?.title ?? "Conversation";
          const latestMessage = latestMessageByConversation.get(conversation.id);
          const unreadLike = latestMessage ? latestMessage.sender_id !== user.id : false;

          return (
            <Link key={conversation.id} href={`/messages/${conversation.id}`} className="block">
              <Card className="rounded-2xl p-3">
                <div className="flex gap-3">
                  <div className="relative shrink-0">
                    <Avatar
                      src={resolveSupabasePublicUrl(otherProfile?.photo_url ?? null, "avatars")}
                      name={otherPersonName(otherProfile)}
                      size="md"
                    />
                    {unreadLike ? (
                      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[var(--color-primary)] ring-2 ring-white" />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                          {otherPersonName(otherProfile)}
                        </p>
                      <span className="shrink-0 text-xs text-[var(--color-text-muted)]">
                        {formatListTimestamp(latestMessage?.created_at ?? conversation.created_at)}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-2 rounded-xl bg-[var(--color-surface)] px-2 py-2">
                      <div className="h-10 w-12 shrink-0 overflow-hidden rounded-md bg-[var(--color-surface-2)]">
                        {listingPhoto ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={listingPhoto}
                            alt={listingTitle}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[var(--color-text-muted)]">
                            <svg
                              viewBox="0 0 24 24"
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              aria-hidden="true"
                            >
                              <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" strokeLinecap="round" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-[var(--color-text-secondary)]">
                          {listing ? formatListingTitle(listing.title) : "Co-founder match"}
                        </p>
                        {typeof listing?.price === "number" ? (
                          <p className="text-xs text-[var(--color-text-muted)]">
                            {formatCurrency(Number(listing.price))}
                          </p>
                        ) : !conversation.listing_id ? (
                          <p className="text-xs text-[var(--color-text-muted)]">
                            Start exploring a potential build partnership
                          </p>
                        ) : null}
                      </div>
                      <Badge variant="neutral" className="shrink-0">
                        {conversation.listing_id ? "On campus" : "Co-founders"}
                      </Badge>
                    </div>

                    <p className="mt-2 truncate text-sm text-[var(--color-text-secondary)]">
                      {latestMessage?.content ?? "Conversation started"}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

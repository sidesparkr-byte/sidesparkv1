"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { RealtimePostgresInsertPayload } from "@supabase/supabase-js";

import { Avatar, Button, TextInput, useToast } from "@/components/ui";
import { resolveSupabasePublicUrl } from "@/lib/media";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatListingTitle } from "@/lib/utils";

type ThreadMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type ListingSummary = {
  id: string;
  title: string;
  price: number;
  photos: string[];
  type: string;
  status?: "active" | "reserved" | "completed";
};

type ThreadClientProps = {
  conversationId: string;
  currentUserId: string;
  listing: ListingSummary | null;
  initialMessages: ThreadMessage[];
  otherPersonName: string;
  otherPersonId: string;
  otherPersonPhotoUrl?: string | null;
  isBuyer?: boolean;
  readOnlyPreview?: boolean;
};

function BannerQrIcon({ colorClassName }: { colorClassName: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 ${colorClassName}`} fill="none" aria-hidden="true">
      <path
        d="M4 4h5v5H4V4Zm11 0h5v5h-5V4ZM4 15h5v5H4v-5Zm8-8h2v2h-2V7Zm0 4h2v2h-2v-2Zm2 2h2v2h-2v-2Zm2-6h2v2h-2V7Zm0 8h4v2h-2v2h-2v-4Zm-4 4h2v2h-2v-2Zm4 2h2v2h-2v-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const PHONE_REGEX =
  /(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/i;
const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const OFF_PLATFORM_TERMS = /\b(?:venmo|cashapp|cash app|zelle|paypal)\b/i;

function containsOffPlatformRisk(content: string) {
  return (
    PHONE_REGEX.test(content) ||
    EMAIL_REGEX.test(content) ||
    OFF_PLATFORM_TERMS.test(content)
  );
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function dayLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const today = new Date();
  const dateKey = date.toDateString();
  const todayKey = today.toDateString();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const yesterdayKey = yesterday.toDateString();
  if (dateKey === todayKey) return "Today";
  if (dateKey === yesterdayKey) return "Yesterday";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(date);
}

function MessageBubble({
  message,
  isOwn
}: {
  message: ThreadMessage;
  isOwn: boolean;
}) {
  const flagged = containsOffPlatformRisk(message.content);
  return (
    <div className={isOwn ? "flex justify-end" : "flex justify-start"}>
      <div className="max-w-[85%] space-y-1">
        <div
          className={
            isOwn
              ? "rounded-2xl rounded-br-md bg-[var(--color-primary)] px-3 py-2 text-white shadow-[0_12px_24px_rgba(0,57,166,0.18)]"
              : "rounded-2xl rounded-bl-md bg-[var(--color-surface-2)] px-3 py-2 text-[var(--color-text-primary)]"
          }
        >
          <p className="whitespace-pre-wrap break-words text-sm leading-5">
            {message.content}
          </p>
        </div>
        <div
          className={
            isOwn
              ? "text-right text-xs text-[var(--color-text-muted)]"
              : "text-xs text-[var(--color-text-muted)]"
          }
        >
          {formatTime(message.created_at)}
        </div>
        {flagged ? (
          <div className="rounded-xl border border-[color:rgba(255,107,53,0.24)] bg-[color:rgba(255,107,53,0.10)] px-3 py-2 text-xs text-[var(--color-accent)]">
            Paying outside SideSpark means no protection and no trade rating.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function EmptyMessageState({
  listing,
  listingPhoto
}: {
  listing: ListingSummary | null;
  listingPhoto: string | null;
}) {
  return (
    <div className="flex min-h-full items-center justify-center px-6 py-10 text-center">
      <div className="w-full max-w-[260px]">
        <div className="mx-auto h-16 w-16 overflow-hidden rounded-xl border border-[#E5E5E5] bg-[#F5F5F5]">
          {listingPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listingPhoto}
              alt={listing?.title ?? "Listing"}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : null}
        </div>
        <p className="mt-2 line-clamp-2 text-center text-[14px] font-semibold text-[#1A1A1A]">
          {listing ? formatListingTitle(listing.title) : "New conversation"}
        </p>
        {listing ? (
          <p className="mt-1 text-center text-[13px] text-[#6B6B6B]">
            {formatCurrency(Number(listing.price))}
          </p>
        ) : null}
        <div className="mx-auto my-4 h-px w-[40%] bg-[#E5E5E5]" />
        <p className="text-center text-[12px] text-[#9A9A9A]">Send a message to get started</p>
      </div>
    </div>
  );
}

export function ThreadClient({
  conversationId,
  currentUserId,
  listing,
  initialMessages,
  otherPersonName,
  otherPersonPhotoUrl,
  isBuyer = false,
  readOnlyPreview = false
}: ThreadClientProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [messages, setMessages] = useState<ThreadMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef<ThreadMessage[]>(initialMessages);
  const listingPhoto = resolveSupabasePublicUrl(listing?.photos?.[0] ?? null, "listing-photos");

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const quickReplies = useMemo(() => {
    if (!listing) {
      return [
        "What are you working on right now?",
        "What kind of co-founder are you looking for?",
        "Want to meet on campus this week?"
      ];
    }

    const suggestedOffer = Math.max(1, Math.round(Number(listing.price) * 0.9));
    return [
      "Is this still available?",
      `Can you do ${formatCurrency(suggestedOffer)}?`,
      "When/where can we meet?"
    ];
  }, [listing]);

  useEffect(() => {
    const node = listRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages.length]);

  useEffect(() => {
    if (readOnlyPreview) {
      return;
    }
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload: RealtimePostgresInsertPayload<Record<string, unknown>>) => {
          const next = payload.new as ThreadMessage;
          setMessages((current) => {
            if (current.some((message) => message.id === next.id)) {
              return current;
            }
            return [...current, next].sort((a, b) => a.created_at.localeCompare(b.created_at));
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, readOnlyPreview]);

  useEffect(() => {
    if (readOnlyPreview) {
      return;
    }

    let cancelled = false;
    const supabase = createClient();

    const poll = async () => {
      if (cancelled) return;

      const current = messagesRef.current;
      const latestCreatedAt = current[current.length - 1]?.created_at ?? null;

      let query = supabase
        .from("messages")
        .select("id,conversation_id,sender_id,content,created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (latestCreatedAt) {
        query = query.gt("created_at", latestCreatedAt);
      }

      const { data, error } = await query;
      if (cancelled || error || !data || data.length === 0) {
        return;
      }

      const incoming = data as ThreadMessage[];
      setMessages((existing) => {
        const seen = new Set(existing.map((message) => message.id));
        const merged = [...existing];
        for (const next of incoming) {
          if (!seen.has(next.id)) {
            seen.add(next.id);
            merged.push(next);
          }
        }
        return merged.sort((a, b) => a.created_at.localeCompare(b.created_at));
      });
    };

    const interval = window.setInterval(() => {
      void poll();
    }, 1500);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [conversationId, readOnlyPreview]);

  async function sendMessage(content: string) {
    const trimmed = content.trim();
    if (!trimmed || sending) return;
    if (readOnlyPreview) {
      showToast("Preview mode: sign in to send messages.", {
        variant: "info",
        title: "Read-only preview"
      });
      return;
    }

    // Scan before insert (deterrent only; message still sends)
    const _hasRisk = containsOffPlatformRisk(trimmed);
    void _hasRisk;

    setSending(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: trimmed
        })
        .select("id,conversation_id,sender_id,content,created_at")
        .single();

      if (error) throw error;

      if (data) {
        const inserted = data as ThreadMessage;
        setMessages((current) => {
          if (current.some((message) => message.id === inserted.id)) return current;
          return [...current, inserted].sort((a, b) => a.created_at.localeCompare(b.created_at));
        });
      }
      setDraft("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to send message.";
      showToast(message, { variant: "error", title: "Send failed" });
    } finally {
      setSending(false);
    }
  }

  let lastDay = "";

  return (
    <div className="-mx-4 -mt-3 flex min-h-[calc(100dvh-56px-60px-env(safe-area-inset-bottom)-12px)] flex-col overflow-x-hidden">
      <div className="border-b border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => router.push("/messages")}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-[var(--color-text-secondary)]"
            aria-label="Back to messages"
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="m12.5 4.5-5 5 5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {listing ? (
            <Link href={`/market/${listing.id}`} className="flex min-w-0 flex-1 items-center gap-2">
                <div className="h-12 w-14 shrink-0 overflow-hidden rounded-lg bg-[var(--color-surface-2)]">
                {listingPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={listingPhoto} alt={listing.title} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{formatListingTitle(listing.title)}</p>
                <p className="truncate text-xs text-[var(--color-text-secondary)]">
                  {formatCurrency(Number(listing.price))} · Chat with {otherPersonName}
                </p>
              </div>
            </Link>
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Avatar src={otherPersonPhotoUrl ?? null} name={otherPersonName} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                  Co-founder Match
                </p>
                <p className="truncate text-xs text-[var(--color-text-secondary)]">
                  Chat with {otherPersonName} about building together
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {listing && isBuyer && listing.status === "reserved" ? (
        <div className="border-b border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3">
          <button
            type="button"
            onClick={() => router.push("/scan")}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#0039A6] bg-[#EEF2FF] px-4 py-3 text-left"
          >
            <div className="flex items-center gap-3">
              <BannerQrIcon colorClassName="text-[#0039A6]" />
              <p className="text-sm font-medium text-[#0039A6]">
                Ready to pick up? Scan the seller&apos;s QR code
              </p>
            </div>
            <span className="shrink-0 text-[13px] font-semibold text-[#0039A6] underline">
              Scan Now →
            </span>
          </button>
        </div>
      ) : null}

      {listing && listing.status === "completed" ? (
        <div className="border-b border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3">
          <div className="flex items-center gap-3 rounded-xl border border-[#2D9B6F] bg-[#EEFAF4] px-4 py-3">
            <BannerQrIcon colorClassName="text-[#2D9B6F]" />
            <p className="text-sm font-medium text-[#2D9B6F]">Transaction complete ✓</p>
          </div>
        </div>
      ) : null}

      <div ref={listRef} className="app-scroll flex-1 space-y-3 overflow-x-hidden overflow-y-auto bg-white px-4 py-3">
        {messages.length === 0 ? (
          <EmptyMessageState listing={listing} listingPhoto={listingPhoto} />
        ) : (
          messages.map((message) => {
            const label = dayLabel(message.created_at);
            const showDay = label !== lastDay;
            if (showDay) lastDay = label;

            return (
              <div key={message.id} className="space-y-3">
                {showDay ? (
                  <div className="flex justify-center">
                    <span className="rounded-full bg-[var(--color-background)] px-3 py-1 text-xs text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]">
                      {label}
                    </span>
                  </div>
                ) : null}
                <MessageBubble
                  message={message}
                  isOwn={String(message.sender_id) === String(currentUserId)}
                />
              </div>
            );
          })
        )}
      </div>

      <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+76px)] z-20 border-t border-[var(--color-border)] bg-[var(--color-background)] px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-2">
        {readOnlyPreview ? (
          <div className="mb-2 rounded-xl border border-[color:rgba(0,57,166,0.18)] bg-[color:rgba(0,57,166,0.08)] px-3 py-2 text-xs text-[var(--color-primary)]">
            Preview mode: chat is read-only until you sign in.
          </div>
        ) : null}
        <div className="app-scroll mb-2 flex gap-2 overflow-x-auto pb-1">
          {quickReplies.map((reply) => (
            <button
              key={reply}
              type="button"
              onClick={() => setDraft(reply)}
              className="shrink-0 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)]/20 hover:text-[var(--color-primary)] min-h-11"
            >
              {reply}
            </button>
          ))}
        </div>

        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void sendMessage(draft);
          }}
        >
          <div className="min-w-0 flex-1">
            <TextInput
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Message…"
              className="min-h-12 text-base"
              autoComplete="off"
              readOnly={readOnlyPreview}
            />
          </div>
          <Button
            type="submit"
            fullWidthMobile={false}
            className="w-auto px-4"
            disabled={!draft.trim() || sending || readOnlyPreview}
            loading={sending}
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}

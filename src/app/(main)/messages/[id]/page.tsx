import { notFound, redirect } from "next/navigation";

import { isDevPreviewEnabled } from "@/lib/dev-preview";
import { resolveSupabasePhotoArray, resolveSupabasePublicUrl } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

import { ThreadClient } from "@/app/(main)/messages/[id]/thread-client";

type ConversationRow = {
  id: string;
  listing_id: string | null;
  buyer_id: string;
  seller_id: string;
};

type ListingRow = {
  id: string;
  title: string;
  price: number;
  photos: string[] | null;
  type: string;
  status: "active" | "reserved" | "completed";
};

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_initial: string | null;
  photo_url?: string | null;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

function displayName(profile?: ProfileRow | null) {
  const first = profile?.first_name?.trim() || "Butler Student";
  const last = profile?.last_initial?.trim();
  return `${first}${last ? ` ${last.toUpperCase()}.` : ""}`;
}

type PageProps = {
  params: {
    id: string;
  };
};

export default async function MessageThreadPage({ params }: PageProps) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    if (isDevPreviewEnabled() && params.id === "preview") {
      return (
        <ThreadClient
          conversationId="00000000-0000-0000-0000-000000000000"
          currentUserId="preview-user"
          listing={{
            id: "preview-item-1",
            title: "Dorm Mini Fridge",
            price: 65,
            photos: [],
            type: "item"
          }}
          initialMessages={[
            {
              id: "preview-msg-1",
              conversation_id: "00000000-0000-0000-0000-000000000000",
              sender_id: "other-user",
              content: "Is this still available?",
              created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString()
            },
            {
              id: "preview-msg-2",
              conversation_id: "00000000-0000-0000-0000-000000000000",
              sender_id: "preview-user",
              content: "Yes! I can meet near Atherton at 4pm.",
              created_at: new Date(Date.now() - 1000 * 60 * 22).toISOString()
            },
            {
              id: "preview-msg-3",
              conversation_id: "00000000-0000-0000-0000-000000000000",
              sender_id: "other-user",
              content: "Perfect. Can you do $60?",
              created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString()
            }
          ]}
          otherPersonId="other-user"
          otherPersonName="Ari M."
          readOnlyPreview
        />
      );
    }
    redirect("/login");
  }

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id,listing_id,buyer_id,seller_id")
    .eq("id", params.id)
    .maybeSingle();

  if (!conversation) {
    notFound();
  }

  const isParticipant =
    conversation.buyer_id === user.id || conversation.seller_id === user.id;
  if (!isParticipant) {
    notFound();
  }

  const otherPersonId =
    conversation.buyer_id === user.id ? conversation.seller_id : conversation.buyer_id;

  const [listingResult, profileResult, messagesResult] = await Promise.all([
    conversation.listing_id
      ? supabase
          .from("listings")
          .select("id,title,price,photos,type,status")
          .eq("id", conversation.listing_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("profiles")
      .select("id,first_name,last_initial,photo_url")
      .eq("id", otherPersonId)
      .maybeSingle(),
    supabase
      .from("messages")
      .select("id,conversation_id,sender_id,content,created_at")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true })
  ]);

  const listingData = listingResult.data as ListingRow | null;
  const profileData = profileResult.data as ProfileRow | null;

  return (
    <ThreadClient
      conversationId={conversation.id}
      currentUserId={user.id}
      listing={
        listingData
          ? {
              id: listingData.id,
              title: listingData.title,
              price: Number(listingData.price),
              photos: resolveSupabasePhotoArray(listingData.photos, "listing-photos"),
              type: listingData.type,
              status: listingData.status
            }
          : null
      }
      initialMessages={((messagesResult.data ?? []) as MessageRow[]) ?? []}
      otherPersonId={otherPersonId}
      otherPersonName={displayName(profileData)}
      otherPersonPhotoUrl={resolveSupabasePublicUrl(profileData?.photo_url ?? null, "avatars")}
      isBuyer={conversation.buyer_id === user.id}
    />
  );
}

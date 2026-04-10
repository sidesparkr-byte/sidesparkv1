import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const listingId = url.searchParams.get("listingId");

  if (!listingId) {
    return NextResponse.redirect(new URL("/market", request.url));
  }

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `/messages/start?listingId=${encodeURIComponent(listingId)}`);
    return NextResponse.redirect(loginUrl);
  }

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id,seller_id")
    .eq("id", listingId)
    .maybeSingle();

  if (listingError || !listing) {
    return NextResponse.redirect(new URL("/market", request.url));
  }

  if (listing.seller_id === user.id) {
    return NextResponse.redirect(new URL(`/market/${listing.id}`, request.url));
  }

  const { data: conversation, error: upsertError } = await supabase
    .from("conversations")
    .upsert(
      {
        listing_id: listing.id,
        buyer_id: user.id,
        seller_id: listing.seller_id
      },
      {
        onConflict: "listing_id,buyer_id"
      }
    )
    .select("id")
    .single();

  if (upsertError || !conversation) {
    return NextResponse.redirect(new URL(`/market/${listing.id}`, request.url));
  }

  return NextResponse.redirect(new URL(`/messages/${conversation.id}`, request.url));
}

import { NextResponse } from "next/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

type ReserveListingBody = {
  listingId?: string;
};

type ReserveListingRow = {
  id: string;
  seller_id: string;
  status: "active" | "reserved" | "completed";
  reserved_by: string | null;
};

function getAdminEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  return { url, serviceRoleKey };
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Please log in to reserve this item." }, { status: 401 });
    }

    const body = (await request.json()) as ReserveListingBody;
    const listingId = body.listingId?.trim();

    if (!listingId) {
      return NextResponse.json({ error: "Listing ID is required." }, { status: 400 });
    }

    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id,seller_id,status,reserved_by")
      .eq("id", listingId)
      .maybeSingle<ReserveListingRow>();

    if (listingError) throw listingError;
    if (!listing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    if (listing.seller_id === user.id) {
      return NextResponse.json({ error: "You can't reserve your own listing." }, { status: 403 });
    }

    if (listing.status === "reserved" && listing.reserved_by === user.id) {
      const { data: existingConversation, error: existingConversationError } = await supabase
        .from("conversations")
        .select("id")
        .eq("listing_id", listing.id)
        .eq("seller_id", listing.seller_id)
        .eq("buyer_id", user.id)
        .maybeSingle();

      if (existingConversationError) throw existingConversationError;
      if (existingConversation?.id) {
        return NextResponse.json({
          success: true,
          conversationId: existingConversation.id
        });
      }

      const { data: restoredConversation, error: restoreConversationError } = await supabase
        .from("conversations")
        .upsert(
          {
            listing_id: listing.id,
            buyer_id: user.id,
            seller_id: listing.seller_id
          },
          { onConflict: "listing_id,buyer_id" }
        )
        .select("id")
        .single();

      if (restoreConversationError || !restoredConversation) {
        throw restoreConversationError ?? new Error("Unable to open the seller conversation.");
      }

      return NextResponse.json({
        success: true,
        conversationId: restoredConversation.id
      });
    }

    if (listing.status !== "active") {
      return NextResponse.json({ error: "This item is no longer available." }, { status: 409 });
    }

    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .upsert(
        {
          listing_id: listing.id,
          buyer_id: user.id,
          seller_id: listing.seller_id
        },
        { onConflict: "listing_id,buyer_id" }
      )
      .select("id")
      .single();

    if (conversationError || !conversation) {
      throw conversationError ?? new Error("Unable to open the seller conversation.");
    }

    const { url, serviceRoleKey } = getAdminEnv();
    const adminClient = createSupabaseAdminClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    const now = new Date().toISOString();
    const { data: updatedListing, error: reserveError } = await adminClient
      .from("listings")
      .update({
        status: "reserved",
        reserved_by: user.id,
        reserved_at: now
      })
      .eq("id", listing.id)
      .eq("status", "active")
      .select("id")
      .maybeSingle();

    if (reserveError) throw reserveError;
    if (!updatedListing) {
      return NextResponse.json({ error: "This item was just reserved by someone else." }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      conversationId: conversation.id
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to reserve this item."
      },
      { status: 400 }
    );
  }
}

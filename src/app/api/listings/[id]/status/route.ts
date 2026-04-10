import { NextResponse } from "next/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

type ListingStatusRow = {
  id: string;
  seller_id: string;
  status: "active" | "reserved" | "completed";
  reserved_by: string | null;
  price: number;
};

type StatusAction = "reserve" | "complete" | "reopen";

function getAdminEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  return { url, serviceRoleKey };
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id,seller_id,status,reserved_by,price")
      .eq("id", params.id)
      .maybeSingle<ListingStatusRow>();

    if (listingError) throw listingError;
    if (!listing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    if (listing.seller_id !== user.id) {
      return NextResponse.json({ error: "Only the seller can update this listing." }, { status: 403 });
    }

    const body = (await request.json()) as { action?: StatusAction; buyerId?: string };
    const action = body.action;

    if (!action || !["reserve", "complete", "reopen"].includes(action)) {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    if (action === "reserve" && listing.status !== "active") {
      return NextResponse.json({ error: "Only active listings can be reserved." }, { status: 400 });
    }

    if (action === "reserve" && !body.buyerId) {
      return NextResponse.json({ error: "Select a buyer before reserving the listing." }, { status: 400 });
    }

    if (action === "complete" && listing.status === "completed") {
      return NextResponse.json({ error: "Listing is already completed." }, { status: 400 });
    }

    if (action === "complete" && !listing.reserved_by) {
      return NextResponse.json({ error: "Reserve the listing for a buyer before completing it." }, { status: 400 });
    }

    if (action === "reserve") {
      const { data: conversation, error: conversationError } = await supabase
        .from("conversations")
        .select("id")
        .eq("listing_id", params.id)
        .eq("seller_id", user.id)
        .eq("buyer_id", body.buyerId)
        .maybeSingle();

      if (conversationError) throw conversationError;
      if (!conversation) {
        return NextResponse.json(
          { error: "Only buyers with a conversation on this listing can be reserved." },
          { status: 400 }
        );
      }
    }

    const now = new Date().toISOString();
    const updatePayload =
      action === "reserve"
        ? {
            status: "reserved" as const,
            reserved_by: body.buyerId ?? null,
            reserved_at: now,
            completed_at: null
          }
        : action === "complete"
          ? {
              status: "completed" as const,
              completed_at: now
            }
          : {
              status: "active" as const,
              reserved_at: null,
              completed_at: null,
              reserved_by: null
            };

    if (action === "complete") {
      const buyerId = listing.reserved_by!;
      const { url, serviceRoleKey } = getAdminEnv();
      const adminClient = createSupabaseAdminClient(url, serviceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });

      const { data: existingTransaction, error: transactionLookupError } = await adminClient
        .from("transactions")
        .select("id")
        .eq("listing_id", params.id)
        .eq("seller_id", user.id)
        .eq("buyer_id", buyerId)
        .maybeSingle();

      if (transactionLookupError) throw transactionLookupError;

      if (existingTransaction) {
        const { error: transactionUpdateError } = await adminClient
          .from("transactions")
          .update({
            status: "completed",
            completed_at: now
          })
          .eq("id", existingTransaction.id);

        if (transactionUpdateError) throw transactionUpdateError;
      } else {
        const { error: transactionInsertError } = await adminClient
          .from("transactions")
          .insert({
            listing_id: params.id,
            seller_id: user.id,
            buyer_id: buyerId,
            item_price: Number(listing.price ?? 0),
            seller_fee_rate: 0,
            seller_fee_amount: 0,
            buyer_fee_rate: 0,
            buyer_fee_amount: 0,
            buyer_fee_minimum: 0,
            total_charge: Number(listing.price ?? 0),
            status: "completed",
            completed_at: now,
            qr_token: crypto.randomUUID()
          });

        if (transactionInsertError) throw transactionInsertError;
      }
    }

    const { data, error } = await supabase
      .from("listings")
      .update(updatePayload)
      .eq("id", params.id)
      .select("id,status,reserved_by,reserved_at,completed_at")
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to update listing status."
      },
      { status: 400 }
    );
  }
}

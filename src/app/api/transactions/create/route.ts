import { NextResponse } from "next/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

type CreateTransactionBody = {
  listingId?: string;
};

type ListingRow = {
  id: string;
  seller_id: string;
  reserved_by: string | null;
  status: "active" | "reserved" | "completed";
  price: number | null;
};

type ExistingTransactionRow = {
  id: string;
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CreateTransactionBody;
    const listingId = body.listingId?.trim();

    if (!listingId) {
      return NextResponse.json({ error: "Listing ID is required." }, { status: 400 });
    }

    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id,seller_id,reserved_by,status,price")
      .eq("id", listingId)
      .maybeSingle<ListingRow>();

    if (listingError) {
      throw listingError;
    }

    if (!listing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    if (listing.seller_id !== user.id) {
      return NextResponse.json({ error: "Only the seller can create this transaction." }, { status: 403 });
    }

    if (listing.status !== "reserved") {
      return NextResponse.json({ error: "Listing must be reserved before generating a QR code." }, { status: 400 });
    }

    if (!listing.reserved_by) {
      return NextResponse.json({ error: "This reserved listing is missing a buyer." }, { status: 400 });
    }

    const { url, serviceRoleKey } = getAdminEnv();
    const adminClient = createSupabaseAdminClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    const { data: existingPendingTransaction, error: existingPendingTransactionError } = await adminClient
      .from("transactions")
      .select("id")
      .eq("listing_id", listingId)
      .eq("status", "pending")
      .maybeSingle<ExistingTransactionRow>();

    if (existingPendingTransactionError) {
      throw existingPendingTransactionError;
    }

    if (existingPendingTransaction) {
      return NextResponse.json(
        { error: "A pending transaction already exists for this listing." },
        { status: 409 }
      );
    }

    const qrToken = `${listingId}-${user.id}-${Date.now()}`;

    const { data: transaction, error: transactionInsertError } = await adminClient
      .from("transactions")
      .insert({
        listing_id: listingId,
        seller_id: user.id,
        buyer_id: listing.reserved_by,
        item_price: Number(listing.price ?? 0),
        seller_fee_rate: 0,
        seller_fee_amount: 0,
        buyer_fee_rate: 0,
        buyer_fee_amount: 0,
        buyer_fee_minimum: 0,
        total_charge: Number(listing.price ?? 0),
        qr_token: qrToken,
        status: "pending"
      })
      .select("id,qr_token")
      .single();

    if (transactionInsertError || !transaction) {
      throw transactionInsertError ?? new Error("Unable to create the transaction.");
    }

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      qrToken: transaction.qr_token
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to create the transaction."
      },
      { status: 500 }
    );
  }
}

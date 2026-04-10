import { NextResponse } from "next/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

type CompleteTransactionBody = {
  qrToken?: string;
};

type TransactionLookupRow = {
  id: string;
  listing_id: string;
  seller_id: string;
  buyer_id: string;
  status: "pending" | "completed";
};

type ListingLookupRow = {
  id: string;
  title: string;
};

type ProfileTradesRow = {
  id: string;
  total_trades: number | null;
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

    const body = (await request.json()) as CompleteTransactionBody;
    const qrToken = body.qrToken?.trim();

    if (!qrToken) {
      return NextResponse.json({ error: "QR token is required." }, { status: 400 });
    }

    const { url, serviceRoleKey } = getAdminEnv();
    const adminClient = createSupabaseAdminClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    const { data: transaction, error: transactionError } = await adminClient
      .from("transactions")
      .select("id,listing_id,seller_id,buyer_id,status")
      .eq("qr_token", qrToken)
      .maybeSingle<TransactionLookupRow>();

    if (transactionError) {
      throw transactionError;
    }

    if (!transaction) {
      return NextResponse.json({ error: "QR code not found." }, { status: 404 });
    }

    if (transaction.status === "completed") {
      return NextResponse.json({ error: "This transaction is already complete." }, { status: 409 });
    }

    if (transaction.buyer_id !== user.id) {
      return NextResponse.json({ error: "Only the buyer can confirm this pickup." }, { status: 403 });
    }

    const { data: listing, error: listingError } = await adminClient
      .from("listings")
      .select("id,title")
      .eq("id", transaction.listing_id)
      .maybeSingle<ListingLookupRow>();

    if (listingError) {
      throw listingError;
    }

    if (!listing) {
      return NextResponse.json({ error: "Listing not found for this transaction." }, { status: 400 });
    }

    const { data: profileRows, error: profilesError } = await adminClient
      .from("profiles")
      .select("id,total_trades")
      .in("id", [transaction.buyer_id, transaction.seller_id]);

    if (profilesError) {
      throw profilesError;
    }

    const buyerProfile = (profileRows as ProfileTradesRow[]).find((row) => row.id === transaction.buyer_id);
    const sellerProfile = (profileRows as ProfileTradesRow[]).find((row) => row.id === transaction.seller_id);

    if (!buyerProfile || !sellerProfile) {
      return NextResponse.json({ error: "Buyer or seller profile is missing." }, { status: 400 });
    }

    try {
      const now = new Date().toISOString();

      const { error: transactionUpdateError } = await adminClient
        .from("transactions")
        .update({
          status: "completed",
          completed_at: now,
          handshake_at: now,
          handshake_buyer_confirmed: true
        })
        .eq("id", transaction.id);

      if (transactionUpdateError) {
        throw transactionUpdateError;
      }

      const { error: listingUpdateError } = await adminClient
        .from("listings")
        .update({
          status: "completed",
          completed_at: now
        })
        .eq("id", transaction.listing_id);

      if (listingUpdateError) {
        throw listingUpdateError;
      }

      const { error: buyerUpdateError } = await adminClient
        .from("profiles")
        .update({
          total_trades: Number(buyerProfile.total_trades ?? 0) + 1
        })
        .eq("id", transaction.buyer_id);

      if (buyerUpdateError) {
        throw buyerUpdateError;
      }

      const { error: sellerUpdateError } = await adminClient
        .from("profiles")
        .update({
          total_trades: Number(sellerProfile.total_trades ?? 0) + 1
        })
        .eq("id", transaction.seller_id);

      if (sellerUpdateError) {
        throw sellerUpdateError;
      }
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Unable to complete the transaction."
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      sellerId: transaction.seller_id,
      buyerId: transaction.buyer_id,
      listingTitle: listing.title
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to complete the transaction."
      },
      { status: 500 }
    );
  }
}

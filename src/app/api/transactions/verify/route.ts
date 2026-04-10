import { NextResponse } from "next/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

type VerifyTransactionBody = {
  listingId?: string;
  qrToken?: string;
};

type ListingRow = {
  id: string;
  seller_id: string;
  reserved_by: string | null;
  status: "active" | "reserved" | "completed";
};

type TransactionRow = {
  id: string;
  buyer_id: string;
  seller_id: string;
  status: "pending" | "completed";
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

    const body = (await request.json()) as VerifyTransactionBody;
    const listingId = body.listingId?.trim();
    const qrToken = body.qrToken?.trim();

    if (!listingId || !qrToken) {
      return NextResponse.json({ error: "Listing ID and QR token are required." }, { status: 400 });
    }

    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id,seller_id,reserved_by,status")
      .eq("id", listingId)
      .maybeSingle<ListingRow>();

    if (listingError) {
      throw listingError;
    }

    if (!listing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    if (listing.reserved_by !== user.id) {
      return NextResponse.json({ error: "Only the reserved buyer can verify this pickup." }, { status: 403 });
    }

    if (listing.status !== "reserved") {
      return NextResponse.json({ error: "This listing is no longer awaiting pickup." }, { status: 400 });
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
      .select("id,buyer_id,seller_id,status")
      .eq("listing_id", listingId)
      .eq("qr_token", qrToken)
      .maybeSingle<TransactionRow>();

    if (transactionError) {
      throw transactionError;
    }

    if (!transaction) {
      return NextResponse.json({ error: "That QR code could not be verified." }, { status: 404 });
    }

    if (transaction.buyer_id !== user.id) {
      return NextResponse.json({ error: "That QR code belongs to a different buyer." }, { status: 403 });
    }

    if (transaction.status === "completed") {
      return NextResponse.json({
        success: true,
        transactionId: transaction.id,
        completed: true
      });
    }

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
      .eq("id", listingId);

    if (listingUpdateError) {
      throw listingUpdateError;
    }

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      completed: true
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to verify this pickup."
      },
      { status: 500 }
    );
  }
}

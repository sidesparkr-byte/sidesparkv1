import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type CreateRatingBody = {
  transactionId?: string;
  stars?: number;
};

type TransactionRow = {
  id: string;
  buyer_id: string;
  seller_id: string;
  status: "pending" | "completed";
};

type ExistingRatingRow = {
  id: string;
};

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Please log in to leave a rating." }, { status: 401 });
    }

    const body = (await request.json()) as CreateRatingBody;
    const transactionId = body.transactionId?.trim();
    const stars = Number(body.stars);

    if (!transactionId) {
      return NextResponse.json({ error: "Transaction ID is required." }, { status: 400 });
    }

    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return NextResponse.json({ error: "Select a rating between 1 and 5 stars." }, { status: 400 });
    }

    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .select("id,buyer_id,seller_id,status")
      .eq("id", transactionId)
      .maybeSingle<TransactionRow>();

    if (transactionError) {
      throw transactionError;
    }

    if (!transaction || transaction.status !== "completed") {
      return NextResponse.json({ error: "Completed transaction not found." }, { status: 404 });
    }

    const isBuyer = transaction.buyer_id === user.id;
    const isSeller = transaction.seller_id === user.id;

    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: "You are not part of this transaction." }, { status: 403 });
    }

    const { data: existingRating, error: existingRatingError } = await supabase
      .from("ratings")
      .select("id")
      .eq("transaction_id", transactionId)
      .eq("rater_id", user.id)
      .maybeSingle<ExistingRatingRow>();

    if (existingRatingError) {
      throw existingRatingError;
    }

    if (existingRating) {
      return NextResponse.json({ error: "You already rated this transaction." }, { status: 409 });
    }

    const ratedId = isBuyer ? transaction.seller_id : transaction.buyer_id;

    const { data: rating, error: ratingError } = await supabase
      .from("ratings")
      .insert({
        transaction_id: transactionId,
        rater_id: user.id,
        rated_id: ratedId,
        stars
      })
      .select("id,rated_id")
      .single();

    if (ratingError || !rating) {
      throw ratingError ?? new Error("Unable to save your rating.");
    }

    return NextResponse.json({
      success: true,
      ratingId: rating.id,
      ratedId: rating.rated_id
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to save your rating."
      },
      { status: 500 }
    );
  }
}

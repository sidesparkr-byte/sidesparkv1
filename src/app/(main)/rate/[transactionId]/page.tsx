import { redirect } from "next/navigation";

import { resolveSupabasePublicUrl } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

import { RatingForm } from "@/app/(main)/rate/[transactionId]/rating-form";

type TransactionRow = {
  id: string;
  buyer_id: string;
  seller_id: string;
  status: "pending" | "completed";
  listings:
    | {
        title: string | null;
      }
    | {
        title: string | null;
      }[]
    | null;
};

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_initial: string | null;
  photo_url: string | null;
};

type RatingRow = {
  id: string;
  stars: number;
};

type PageProps = {
  params: {
    transactionId: string;
  };
};

function displayName(profile?: ProfileRow | null) {
  const first = profile?.first_name?.trim() || "Butler Student";
  const last = profile?.last_initial?.trim();
  return `${first}${last ? ` ${last.toUpperCase()}.` : ""}`;
}

function getJoinedObject<T>(value: T | T[] | null | undefined) {
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default async function RateTransactionPage({ params }: PageProps) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/rate/${params.transactionId}`)}`);
  }

  const { data: transaction, error: transactionError } = await supabase
    .from("transactions")
    .select("id,buyer_id,seller_id,status,listings(title)")
    .eq("id", params.transactionId)
    .maybeSingle<TransactionRow>();

  if (transactionError || !transaction) {
    redirect("/");
  }

  const isBuyer = transaction.buyer_id === user.id;
  const isSeller = transaction.seller_id === user.id;

  if (!isBuyer && !isSeller) {
    redirect("/");
  }

  if (transaction.status !== "completed") {
    redirect("/");
  }

  const ratedId = isBuyer ? transaction.seller_id : transaction.buyer_id;

  const [ratedProfileResult, existingRatingResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,first_name,last_initial,photo_url")
      .eq("id", ratedId)
      .maybeSingle<ProfileRow>(),
    supabase
      .from("ratings")
      .select("id,stars")
      .eq("transaction_id", transaction.id)
      .eq("rater_id", user.id)
      .maybeSingle<RatingRow>()
  ]);

  const listing = getJoinedObject(transaction.listings);
  const ratedProfile = ratedProfileResult.data ?? null;

  return (
    <RatingForm
      transactionId={transaction.id}
      otherPersonName={displayName(ratedProfile)}
      otherPersonPhotoUrl={resolveSupabasePublicUrl(ratedProfile?.photo_url ?? null, "avatars")}
      relationshipLabel={
        isBuyer
          ? `${displayName(ratedProfile)} sold you ${listing?.title?.trim() || "this listing"}`
          : `${displayName(ratedProfile)} bought your ${listing?.title?.trim() || "listing"}`
      }
      raterRole={isBuyer ? "buyer" : "seller"}
      existingStars={existingRatingResult.data?.stars ?? null}
    />
  );
}

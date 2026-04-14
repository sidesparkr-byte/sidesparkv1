import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type RemoveListingBody = {
  listingId?: string;
};

type ListingOwnerRow = {
  id: string;
  seller_id: string;
};

export async function DELETE(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as RemoveListingBody;
    const listingId = body.listingId?.trim();

    if (!listingId) {
      return NextResponse.json({ error: "Listing ID is required." }, { status: 400 });
    }

    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id,seller_id")
      .eq("id", listingId)
      .maybeSingle<ListingOwnerRow>();

    if (listingError) {
      throw listingError;
    }

    if (!listing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    if (listing.seller_id !== user.id) {
      return NextResponse.json({ error: "Only the seller can remove this listing." }, { status: 403 });
    }

    const { error: updateError } = await supabase
      .from("listings")
      .update({ status: "removed" })
      .eq("id", listingId)
      .eq("seller_id", user.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to remove listing."
      },
      { status: 400 }
    );
  }
}

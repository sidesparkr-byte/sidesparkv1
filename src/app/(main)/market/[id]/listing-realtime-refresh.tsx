"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export function ListingRealtimeRefresh({ listingId }: { listingId: string }) {
  const router = useRouter();

  useEffect(() => {
    if (!listingId) return;

    const channel = supabase
      .channel(`listing-status-${listingId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "listings",
          filter: `id=eq.${listingId}`
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [listingId, router]);

  return null;
}

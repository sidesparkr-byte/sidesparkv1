"use client";

import { createClient } from "@/lib/supabase/client";

import type { PhotoDraft } from "@/app/(main)/market/sell/_components/photo-uploader";

export async function uploadListingPhotos(args: {
  userId: string;
  listingId: string;
  photos: PhotoDraft[];
  maxCount: number;
}) {
  const { userId, listingId, photos, maxCount } = args;
  const supabase = createClient();
  const limitedPhotos = photos.slice(0, maxCount);
  const uploadedUrls: string[] = [];

  for (const [index, photo] of limitedPhotos.entries()) {
    const extension = photo.file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeStem = photo.file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 48);
    const filePath = `${userId}/${listingId}/${String(index + 1).padStart(2, "0")}-${safeStem}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("listing-photos")
      .upload(filePath, photo.file, {
        cacheControl: "3600",
        upsert: true
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from("listing-photos").getPublicUrl(filePath);
    uploadedUrls.push(data.publicUrl);
  }

  return uploadedUrls;
}

export function createListingId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}


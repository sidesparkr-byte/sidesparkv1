function hasProtocol(value: string) {
  return /^https?:\/\//i.test(value) || value.startsWith("data:") || value.startsWith("blob:");
}

function getSupabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw || typeof raw !== "string") {
    return null;
  }
  return raw.replace(/\/+$/, "");
}

export function resolveSupabasePublicUrl(
  value: string | null | undefined,
  bucket?: "avatars" | "listing-photos"
) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  if (hasProtocol(normalized)) {
    return normalized;
  }

  const baseUrl = getSupabaseBaseUrl();
  if (!baseUrl) {
    return normalized;
  }

  if (normalized.startsWith("/storage/v1/object/public/")) {
    return `${baseUrl}${normalized}`;
  }

  if (bucket) {
    return `${baseUrl}/storage/v1/object/public/${bucket}/${normalized.replace(/^\/+/, "")}`;
  }

  return normalized;
}

export function resolveSupabasePhotoArray(
  values: string[] | null | undefined,
  bucket?: "avatars" | "listing-photos"
) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((value) => resolveSupabasePublicUrl(value, bucket))
    .filter((value): value is string => Boolean(value));
}

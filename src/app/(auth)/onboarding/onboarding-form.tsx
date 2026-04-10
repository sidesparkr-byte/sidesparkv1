"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Avatar, Button, Card, Input, Select, TextArea } from "@/components/ui";
import { resolveSupabasePublicUrl } from "@/lib/media";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";

type OnboardingDefaults = {
  first_name?: string | null;
  last_initial?: string | null;
  graduation_year?: number | null;
  bio?: string | null;
  major?: string | null;
  photo_url?: string | null;
};

type OnboardingFormProps = {
  userId: string;
  email: string;
  defaults?: OnboardingDefaults | null;
  nextPath?: string | null;
};

const GRAD_YEARS = [2025, 2026, 2027, 2028, 2029] as const;

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function OnboardingForm({
  userId,
  email,
  defaults,
  nextPath
}: OnboardingFormProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(defaults?.first_name ?? "");
  const [lastInitial, setLastInitial] = useState(defaults?.last_initial ?? "");
  const [graduationYear, setGraduationYear] = useState(
    defaults?.graduation_year ? String(defaults.graduation_year) : ""
  );
  const [major, setMajor] = useState(defaults?.major ?? "");
  const [bio, setBio] = useState(defaults?.bio ?? "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avatarPreview =
    photoPreviewUrl ?? resolveSupabasePublicUrl(defaults?.photo_url ?? null, "avatars");

  const initialsName = useMemo(
    () => `${firstName || "B"} ${lastInitial || "S"}`.trim(),
    [firstName, lastInitial]
  );

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setPhotoFile(file);
    setError(null);

    if (!file) {
      setPhotoPreviewUrl(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      setPhotoFile(null);
      setPhotoPreviewUrl(null);
      return;
    }

    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
    }

    setPhotoPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const normalizedFirstName = firstName.trim();
    const normalizedLastInitial = lastInitial.trim().slice(0, 1).toUpperCase();
    const gradYearNumber = Number(graduationYear);

    if (!normalizedFirstName) {
      setError("First name is required.");
      return;
    }

    if (!normalizedLastInitial) {
      setError("Last initial is required.");
      return;
    }

    if (!GRAD_YEARS.includes(gradYearNumber as (typeof GRAD_YEARS)[number])) {
      setError("Select a graduation year between 2025 and 2029.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createSupabaseClient();

      let photoUrl = defaults?.photo_url ?? null;

      if (photoFile) {
        const extension = photoFile.name.split(".").pop() || "jpg";
        const filePath = `${userId}/${Date.now()}-${sanitizeFileName(
          photoFile.name.replace(new RegExp(`\\.${extension}$`), "")
        )}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, photoFile, {
            cacheControl: "3600",
            upsert: true
          });

        if (uploadError) {
          setError(uploadError.message);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);
        photoUrl = publicUrlData.publicUrl;
      }

      const profilePayload: Record<string, unknown> = {
        id: userId,
        email,
        first_name: normalizedFirstName,
        last_initial: normalizedLastInitial,
        graduation_year: gradYearNumber,
        major: major.trim() || null,
        bio: bio.trim() || null,
        updated_at: new Date().toISOString()
      };

      if (photoUrl) {
        profilePayload.photo_url = photoUrl;
      }

      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert(profilePayload, { onConflict: "id" });

      if (upsertError) {
        setError(upsertError.message);
        return;
      }

      router.replace(nextPath || "/market");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to finish onboarding.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
          Complete your profile
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Butler students only. This helps buyers and sellers trust each other.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <Avatar src={avatarPreview} name={initialsName} size="lg" />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{email}</p>
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--color-primary)]">
              <span>Upload photo (optional)</span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handlePhotoChange}
              />
            </label>
          </div>
        </div>

        <Input
          label="First name"
          placeholder="Jordan"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          required
        />

        <Input
          label="Last initial"
          placeholder="P"
          maxLength={1}
          value={lastInitial}
          onChange={(event) =>
            setLastInitial(event.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 1).toUpperCase())
          }
          required
        />

        <Select
          label="Graduation year"
          value={graduationYear}
          onChange={(event) => setGraduationYear(event.target.value)}
          required
        >
          <option value="" disabled>
            Select a year
          </option>
          {GRAD_YEARS.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </Select>

        <Input
          label="Major (optional)"
          placeholder="Computer Science"
          value={major}
          onChange={(event) => setMajor(event.target.value)}
        />

        <TextArea
          label="Bio (optional)"
          placeholder="Short intro, interests, or what you’re selling/building."
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          maxLength={180}
        />

        {error ? <p className="text-sm text-[var(--color-accent)]">{error}</p> : null}

        <Button type="submit" loading={loading}>
          Get Started
        </Button>
      </form>
    </Card>
  );
}

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
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avatarPreview =
    photoPreviewUrl ?? resolveSupabasePublicUrl(defaults?.photo_url ?? null, "avatars");

  const initialsName = useMemo(
    () => `${firstName || "B"} ${lastInitial || "S"}`.trim(),
    [firstName, lastInitial]
  );
  const canSubmit =
    firstName.trim().length > 0 &&
    lastInitial.trim().length > 0 &&
    GRAD_YEARS.includes(Number(graduationYear) as (typeof GRAD_YEARS)[number]) &&
    agreedToTerms;

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

    if (!agreedToTerms) {
      setError("You must agree to the Terms and Conditions to continue.");
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
        terms_accepted_at: new Date().toISOString(),
        terms_version: "1.0",
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

      router.replace(nextPath || "/feed");
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

        <div className="!mt-6 border-t border-[#E5E5E5] pt-6">
          <h2 className="text-[15px] font-semibold text-[#1A1A1A]">Before you join</h2>
          <p className="mb-4 mt-1 text-[13px] text-[#6B6B6B]">
            Here&apos;s what you&apos;re agreeing to:
          </p>

          <div className="space-y-2.5">
            {[
              "SideSpark connects buyers and sellers. We are not a party to any transaction.",
              "All trades happen in person on campus in public locations only.",
              "No in-app payments during beta. Coordinate payment directly with the other party.",
              "You must be a currently enrolled Butler University student aged 18+."
            ].map((point) => (
              <div key={point} className="flex gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0039A6]" />
                <p className="text-[13px] leading-[1.5] text-[#595959]">{point}</p>
              </div>
            ))}
          </div>

          <a
            href="/terms"
            target="_blank"
            rel="noreferrer"
            className="mt-3 block text-[13px] text-[#0039A6] underline underline-offset-2"
          >
            Read the full Terms and Conditions →
          </a>

          <label className="mt-4 flex items-start gap-2.5">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(event) => {
                setAgreedToTerms(event.target.checked);
                setError(null);
              }}
              className="mt-0.5 h-[18px] min-w-[18px] accent-[#0039A6]"
            />
            <span className="text-[13px] leading-[1.5] text-[#1A1A1A]">
              I have read and agree to SideSpark&apos;s{" "}
              <a
                href="/terms"
                target="_blank"
                rel="noreferrer"
                className="text-[#0039A6] underline underline-offset-2"
              >
                Terms and Conditions
              </a>{" "}
              and confirm I am a currently enrolled Butler University student aged 18 or
              older.
            </span>
          </label>
        </div>

        {error ? <p className="text-sm text-[var(--color-accent)]">{error}</p> : null}

        <Button
          type="submit"
          loading={loading}
          disabled={!canSubmit}
          className="bg-[#0039A6] text-white disabled:bg-[#E5E5E5] disabled:text-[#9A9A9A] disabled:opacity-100"
        >
          Get Started
        </Button>
      </form>
    </Card>
  );
}

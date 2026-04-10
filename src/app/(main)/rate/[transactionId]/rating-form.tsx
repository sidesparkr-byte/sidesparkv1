"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Avatar, Button, useToast } from "@/components/ui";

type RatingFormProps = {
  transactionId: string;
  otherPersonName: string;
  otherPersonPhotoUrl?: string | null;
  relationshipLabel: string;
  raterRole: "buyer" | "seller";
  existingStars?: number | null;
};

type RatingPageState = "rating" | "submitted" | "already_rated";

function StarIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9" fill={active ? "#F4B942" : "none"} aria-hidden="true">
      <path
        d="m12 3.8 2.4 4.8 5.3.8-3.8 3.7.9 5.2-4.8-2.5-4.8 2.5.9-5.2-3.8-3.7 5.3-.8L12 3.8Z"
        stroke={active ? "#F4B942" : "#E5E5E5"}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SuccessStarGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9 text-[#F4B942]" fill="currentColor" aria-hidden="true">
      <path d="m12 3.8 2.4 4.8 5.3.8-3.8 3.7.9 5.2-4.8-2.5-4.8 2.5.9-5.2-3.8-3.7 5.3-.8L12 3.8Z" />
    </svg>
  );
}

export function RatingForm({
  transactionId,
  otherPersonName,
  otherPersonPhotoUrl,
  relationshipLabel,
  raterRole,
  existingStars = null
}: RatingFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [selectedStars, setSelectedStars] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [pageState, setPageState] = useState<RatingPageState>(
    existingStars != null ? "already_rated" : "rating"
  );

  useEffect(() => {
    if (pageState !== "submitted") {
      return;
    }

    const timeout = window.setTimeout(() => {
      router.push("/");
    }, 2000);

    return () => window.clearTimeout(timeout);
  }, [pageState, router]);

  async function handleSubmit() {
    if (!selectedStars || submitting || pageState !== "rating") {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/ratings/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          transactionId,
          stars: selectedStars
        })
      });

      const data = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to submit your rating.");
      }

      setPageState("submitted");
      showToast(
        raterRole === "seller"
          ? "Thanks for rating your buyer."
          : "Your rating has been submitted.",
        {
        variant: "success",
        title: raterRole === "seller" ? "Buyer rated" : "Rating submitted"
      });
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to submit your rating.", {
        variant: "error",
        title: "Rating failed"
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (pageState === "submitted" || pageState === "already_rated") {
    const alreadyRated = pageState === "already_rated";

    return (
      <div className="-mx-4 -my-3 flex min-h-[100dvh] items-center justify-center overflow-x-hidden bg-white px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(24px,env(safe-area-inset-top))]">
        <div className="flex w-full max-w-[320px] flex-col items-center gap-4 text-center">
          <div
            className={`flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#FFF8E7] ${
              alreadyRated ? "" : "animate-[scale-in_300ms_ease-out]"
            }`}
          >
            <SuccessStarGlyph />
          </div>
          <div className="space-y-2">
            <h1 className="font-heading text-[22px] font-bold text-[var(--color-text-primary)]">
              {alreadyRated ? "You've already rated this transaction" : "Rating submitted!"}
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              {alreadyRated
                ? "Your rating is already saved for this transaction."
                : raterRole === "seller"
                  ? "Thanks for rating your buyer."
                  : "Thanks for helping build trust on SideSpark"}
            </p>
          </div>
          <Button variant="primary" onClick={() => router.push("/")} className="min-h-[52px] rounded-xl">
            Back to Feed
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-4 -my-3 flex min-h-[100dvh] items-center justify-center overflow-x-hidden bg-white px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(24px,env(safe-area-inset-top))]">
      <div className="w-full max-w-[320px] space-y-8">
        <section className="space-y-3 text-center">
          <Avatar
            src={otherPersonPhotoUrl ?? null}
            name={otherPersonName}
            alt={`${otherPersonName} avatar`}
            size="lg"
            className="mx-auto h-[72px] w-[72px] border-[3px] border-[#0039A6] ring-0"
          />
          <div className="space-y-1">
            <h1 className="font-heading text-[18px] font-bold text-[var(--color-text-primary)]">
              {otherPersonName}
            </h1>
            <p className="text-[13px] text-[var(--color-text-muted)]">{relationshipLabel}</p>
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-2 text-center">
            <h2 className="font-heading text-[20px] font-bold text-[var(--color-text-primary)]">
              How was your experience?
            </h2>
            <p className="text-[13px] text-[var(--color-text-muted)]">
              Your rating helps build trust on SideSpark
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setSelectedStars(star)}
                className="flex h-12 w-12 items-center justify-center transition duration-100 hover:scale-[1.15]"
                aria-label={`Rate ${star} star${star === 1 ? "" : "s"}`}
              >
                <StarIcon active={selectedStars >= star} />
              </button>
            ))}
          </div>
        </section>

        <div className="space-y-3">
          <Button
            variant="primary"
            loading={submitting}
            disabled={selectedStars === 0}
            onClick={() => void handleSubmit()}
            className={
              selectedStars === 0
                ? "min-h-[52px] rounded-xl bg-[#E5E5E5] text-[#9A9A9A] shadow-none hover:bg-[#E5E5E5]"
                : "min-h-[52px] rounded-xl"
            }
          >
            Submit Rating
          </Button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="block w-full text-center text-[13px] font-medium text-[#9A9A9A] underline"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}

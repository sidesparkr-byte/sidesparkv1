"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge, Button, Card, Input, Select, TextArea, useToast } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

import { AvailabilityPicker, type AvailabilityValue } from "@/app/(main)/market/sell/_components/availability-picker";
import { createListingId, uploadListingPhotos } from "@/app/(main)/market/sell/_components/helpers";
import { PhotoUploader, type PhotoDraft } from "@/app/(main)/market/sell/_components/photo-uploader";

type Props = { userId: string };

const SERVICE_TYPES = [
  "Photography",
  "DJing",
  "Moving Help",
  "Cleaning",
  "Other"
] as const;

const SELL_BUTTON_ACTIVE_CLASSES =
  "cursor-pointer bg-[#0039A6] text-white opacity-100 disabled:bg-[#0039A6] disabled:text-white disabled:opacity-80 [&_svg]:h-[18px] [&_svg]:w-[18px]";
const SELL_BUTTON_DISABLED_CLASSES =
  "pointer-events-none cursor-not-allowed bg-[#E5E5E5] text-[#9A9A9A] opacity-100 shadow-none disabled:bg-[#E5E5E5] disabled:text-[#9A9A9A] disabled:opacity-100";

function sellButtonClasses(isActive: boolean) {
  return isActive ? SELL_BUTTON_ACTIVE_CLASSES : SELL_BUTTON_DISABLED_CLASSES;
}

export function ServiceSellForm({ userId }: Props) {
  const router = useRouter();
  const { showToast } = useToast();

  const [serviceType, setServiceType] = useState<string>(SERVICE_TYPES[0]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rateInput, setRateInput] = useState("");
  const [rateType, setRateType] = useState<"hourly" | "session">("hourly");
  const [availability, setAvailability] = useState<AvailabilityValue>({ days: [], windows: [] });
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rate = Number(rateInput);
  const hasValidRate = useMemo(
    () => !!rateInput && Number.isFinite(rate) && rate > 0,
    [rate, rateInput]
  );
  const canSubmit =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    !!rateInput &&
    Number.isFinite(rate) &&
    rate > 0;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      const listingId = createListingId();
      const uploadedPhotos = photos.length
        ? await uploadListingPhotos({
            userId,
            listingId,
            photos,
            maxCount: 3
          })
        : [];

      const supabase = createClient();
      const { error: insertError } = await supabase.from("listings").insert({
        id: listingId,
        seller_id: userId,
        type: "service",
        title: title.trim(),
        description: description.trim(),
        price: rate,
        category: "Services",
        photos: uploadedPhotos,
        availability: {
          days: availability.days,
          windows: availability.windows,
          service_type: serviceType,
          rate_type: rateType,
          label:
            availability.days.length || availability.windows.length
              ? undefined
              : "Flexible scheduling"
        }
      });

      if (insertError) throw insertError;

      showToast("Service listing posted.", { variant: "success", title: "Posted" });
      router.push(`/market/${listingId}`);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to post service.";
      setError(message);
      showToast(message, { variant: "error", title: "Post failed" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 pb-2">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">List a Service</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Offer campus-friendly services and let students message you directly to book.
        </p>
      </div>

      <Card className="space-y-4 rounded-2xl p-4">
        <Select label="Service type" value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
          {SERVICE_TYPES.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </Select>
        <Input label="Title" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value.slice(0, 80))} placeholder="Dorm move-in help this weekend" />
        <TextArea label="Description" maxLength={500} value={description} onChange={(e) => setDescription(e.target.value.slice(0, 500))} placeholder="What's included, tools, turnaround, and limits..." />
        <Input label={`Rate (${rateType === "hourly" ? "per hour" : "per session"})`} type="number" step="0.01" min="0" value={rateInput} onChange={(e) => setRateInput(e.target.value)} placeholder="35.00" />

        <div>
          <p className="mb-2 text-sm font-medium text-[var(--color-text-secondary)]">Rate type</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              ["hourly", "Per hour"],
              ["session", "Per session"]
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setRateType(value)}
                className={
                  value === rateType
                    ? "min-h-11 rounded-xl border border-[color:rgba(0,57,166,0.14)] bg-[color:rgba(0,57,166,0.10)] text-sm font-semibold text-[var(--color-primary)]"
                    : "min-h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-sm font-medium text-[var(--color-text-secondary)]"
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <AvailabilityPicker value={availability} onChange={setAvailability} />

        <PhotoUploader
          photos={photos}
          onChange={setPhotos}
          maxPhotos={3}
          label="Portfolio photos (optional)"
          helperText="Upload up to 3 sample images."
        />

        {hasValidRate ? (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">Rate shown on listing</p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Students will contact you in chat to confirm timing, scope, and next steps.
              </p>
            </div>
        ) : (
          <p className="text-sm text-[var(--color-accent)]">
            Enter a rate above $0.00 to post the listing.
          </p>
        )}
        {error ? <p className="text-sm text-[var(--color-accent)]">{error}</p> : null}
        <Button
          loading={submitting}
          disabled={!canSubmit}
          onClick={handleSubmit}
          className={sellButtonClasses(canSubmit || submitting)}
        >
          Post Listing
        </Button>
      </Card>
    </div>
  );
}

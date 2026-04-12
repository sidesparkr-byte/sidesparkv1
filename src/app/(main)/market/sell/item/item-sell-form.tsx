"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge, Button, Card, Input, Select, TextArea, useToast } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

import { PhotoUploader, type PhotoDraft } from "@/app/(main)/market/sell/_components/photo-uploader";
import { createListingId, uploadListingPhotos } from "@/app/(main)/market/sell/_components/helpers";

type ItemSellFormProps = {
  userId: string;
  initialCategory?: (typeof ITEM_CATEGORIES)[number];
};

const ITEM_CATEGORIES = ["Items", "Books"] as const;
const ITEM_CONDITIONS = [
  { label: "New (Unopened)", value: "new" },
  { label: "Like New", value: "like_new" },
  { label: "Good", value: "good" },
  { label: "Fair", value: "fair" }
] as const;

const SELL_BUTTON_ACTIVE_CLASSES =
  "cursor-pointer bg-[#0039A6] text-white opacity-100 disabled:bg-[#0039A6] disabled:text-white disabled:opacity-80 [&_svg]:h-[18px] [&_svg]:w-[18px]";
const SELL_BUTTON_DISABLED_CLASSES =
  "pointer-events-none cursor-not-allowed bg-[#E5E5E5] text-[#9A9A9A] opacity-100 shadow-none disabled:bg-[#E5E5E5] disabled:text-[#9A9A9A] disabled:opacity-100";

function sellButtonClasses(isActive: boolean) {
  return isActive ? SELL_BUTTON_ACTIVE_CLASSES : SELL_BUTTON_DISABLED_CLASSES;
}

export function ItemSellForm({
  userId,
  initialCategory = ITEM_CATEGORIES[0]
}: ItemSellFormProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [step, setStep] = useState(1);
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(initialCategory);
  const [condition, setCondition] = useState<string>("like_new");
  const [priceInput, setPriceInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const price = Number(priceInput);
  const hasValidPrice = useMemo(
    () => !!priceInput && Number.isFinite(price) && price > 0,
    [priceInput, price]
  );

  const canAdvanceStep1 = photos.length > 0;
  const canAdvanceStep2 =
    title.trim().length > 0 &&
    title.trim().length <= 80 &&
    description.trim().length > 0 &&
    description.trim().length <= 500;
  const canSubmitStep3 =
    !!priceInput &&
    Number.isFinite(price) &&
    price > 0;

  async function handleSubmit() {
    if (!canSubmitStep3) return;
    setSubmitting(true);
    setError(null);

    try {
      const listingId = createListingId();
      const uploadedPhotos = await uploadListingPhotos({
        userId,
        listingId,
        photos,
        maxCount: 5
      });

      const supabase = createClient();
      const { error: insertError } = await supabase.from("listings").insert({
        id: listingId,
        seller_id: userId,
        type: "item",
        title: title.trim(),
        description: description.trim(),
        price,
        category,
        condition: condition === "new" ? "like_new" : condition,
        photos: uploadedPhotos
      });

      if (insertError) throw insertError;

      showToast("Listing posted successfully.", {
        variant: "success",
        title: "Item listed"
      });
      router.push(`/market/${listingId}`);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to post listing.";
      setError(message);
      showToast(message, { variant: "error", title: "Post failed" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 pb-2">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            Sell an Item
          </h1>
          <Badge variant="info">3 steps</Badge>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Add photos, details, and price. Cover photo is the first image.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((index) => (
          <div
            key={index}
            className={
              index <= step
                ? "h-1.5 rounded-full bg-[var(--color-primary)]"
                : "h-1.5 rounded-full bg-[var(--color-surface-2)]"
            }
          />
        ))}
      </div>

      {step === 1 ? (
        <Card className="space-y-4 rounded-2xl p-4">
          <PhotoUploader
            photos={photos}
            onChange={setPhotos}
            maxPhotos={3}
            label="Photos"
            helperText="Add up to 3 photos"
          />
          <Button
            disabled={!canAdvanceStep1}
            onClick={() => setStep(2)}
            className={sellButtonClasses(canAdvanceStep1)}
          >
            Next
          </Button>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card className="space-y-4 rounded-2xl p-4">
          <Input
            label="Step 2: Title"
            value={title}
            onChange={(event) => setTitle(event.target.value.slice(0, 80))}
            maxLength={80}
            placeholder="Wood desk lamp"
            helperText={`${title.length}/80`}
          />
          <TextArea
            label="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value.slice(0, 500))}
            maxLength={500}
            placeholder="Condition, dimensions, pickup details..."
          />
          <Select label="Category" value={category} onChange={(event) => setCategory(event.target.value)}>
            {ITEM_CATEGORIES.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </Select>
          <Select label="Condition" value={condition} onChange={(event) => setCondition(event.target.value)}>
            {ITEM_CONDITIONS.map((option) => (
              <option key={`${option.value}-${option.label}`} value={option.value}>{option.label}</option>
            ))}
          </Select>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              disabled={!canAdvanceStep2}
              onClick={() => setStep(3)}
              className={sellButtonClasses(canAdvanceStep2)}
            >
              Next
            </Button>
          </div>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card className="space-y-4 rounded-2xl p-4">
          <Input
            label="Step 3: Price"
            type="number"
            min="0"
            step="0.01"
            placeholder="25.00"
            value={priceInput}
            onChange={(event) => setPriceInput(event.target.value)}
            helperText="Set the amount you want shown on the listing."
          />
          {hasValidPrice ? (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">Message-first checkout</p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Buyers will message you directly to arrange pickup and the handoff.
              </p>
            </div>
          ) : (
            <p className="text-sm text-[var(--color-accent)]">
              Enter a price above $0.00 to post the listing.
            </p>
          )}
          {error ? <p className="text-sm text-[var(--color-accent)]">{error}</p> : null}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep(2)} disabled={submitting}>
              Back
            </Button>
            <Button
              loading={submitting}
              disabled={!canSubmitStep3}
              onClick={handleSubmit}
              className={sellButtonClasses(canSubmitStep3 || submitting)}
            >
              Post Listing
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

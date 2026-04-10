"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, useToast } from "@/components/ui";

type ReserveItemButtonProps = {
  listingId: string;
  disabledState: "available" | "reserved_by_you" | "reserved_other" | "completed";
};

export function ReserveItemButton({
  listingId,
  disabledState
}: ReserveItemButtonProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const disabled = disabledState !== "available";
  const label =
    disabledState === "reserved_by_you"
      ? "Reserved by You"
      : disabledState === "reserved_other"
        ? "No Longer Available"
        : disabledState === "completed"
          ? "Completed"
          : "Reserve Item";

  async function handleReserve() {
    if (disabled) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/listings/reserve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ listingId })
      });

      const data = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        conversationId?: string | null;
        error?: string;
      };

      if (!response.ok || !data.success || !data.conversationId) {
        throw new Error(data.error || "Unable to reserve this item.");
      }

      showToast("Item reserved! Message the seller to arrange pickup.", {
        variant: "success",
        title: "Item reserved!"
      });
      router.push(`/messages/${data.conversationId}`);
      router.refresh();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Unable to reserve this item.",
        {
          variant: "error",
          title: "Reservation failed"
        }
      );
    } finally {
      setLoading(false);
    }
  }

  if (disabled) {
    return (
      <Button
        variant="secondary"
        disabled
        className="min-h-[52px] border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] shadow-none"
      >
        {label}
      </Button>
    );
  }

  return (
    <Button
      variant="danger"
      loading={loading}
      onClick={handleReserve}
      className="min-h-[52px] rounded-xl shadow-[0_12px_28px_rgba(255,107,53,0.24)]"
    >
      Reserve Item
    </Button>
  );
}

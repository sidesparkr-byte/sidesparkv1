"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button, Select, useToast } from "@/components/ui";

type ListingStatus = "active" | "reserved" | "completed";
type StatusAction = "reserve" | "complete" | "reopen";
type ReservationOption = {
  buyerId: string;
  label: string;
};

type ListingStatusControlsProps = {
  listingId: string;
  status: ListingStatus;
  reservedBy: string | null;
  reservationOptions: ReservationOption[];
};

const ACTION_COPY: Record<
  StatusAction,
  { label: string; successTitle: string; successMessage: string }
> = {
  reserve: {
    label: "Mark Reserved",
    successTitle: "Listing reserved",
    successMessage: "This listing is now marked as reserved."
  },
  complete: {
    label: "Mark Completed",
    successTitle: "Listing completed",
    successMessage: "This listing is now marked as completed."
  },
  reopen: {
    label: "Reopen Listing",
    successTitle: "Listing reopened",
    successMessage: "This listing is active again."
  }
};

function actionsForStatus(status: ListingStatus): StatusAction[] {
  if (status === "active") return ["reserve"];
  if (status === "reserved") return ["complete", "reopen"];
  return ["reopen"];
}

export function ListingStatusControls({
  listingId,
  status,
  reservedBy,
  reservationOptions
}: ListingStatusControlsProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pendingAction, setPendingAction] = useState<StatusAction | null>(null);
  const [selectedBuyerId, setSelectedBuyerId] = useState<string>(reservedBy ?? reservationOptions[0]?.buyerId ?? "");
  const [isPending, startTransition] = useTransition();

  function runAction(action: StatusAction) {
    setPendingAction(action);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/listings/${listingId}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            action,
            buyerId: action === "reserve" ? selectedBuyerId : undefined
          })
        });

        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error || "Unable to update listing status.");
        }

        showToast(ACTION_COPY[action].successMessage, {
          variant: "success",
          title: ACTION_COPY[action].successTitle
        });
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to update listing status.";
        showToast(message, {
          variant: "error",
          title: "Status update failed"
        });
      } finally {
        setPendingAction(null);
      }
    });
  }

  return (
    <div className="space-y-2">
      {status === "active" ? (
        <Select
          label="Reserve for buyer"
          value={selectedBuyerId}
          onChange={(event) => setSelectedBuyerId(event.target.value)}
          helperText={
            reservationOptions.length > 0
              ? "Choose a buyer from your active conversations."
              : "No buyers have messaged you about this listing yet."
          }
          disabled={reservationOptions.length === 0 || isPending}
        >
          {reservationOptions.length > 0 ? (
            reservationOptions.map((option) => (
              <option key={option.buyerId} value={option.buyerId}>
                {option.label}
              </option>
            ))
          ) : (
            <option value="">No buyers available</option>
          )}
        </Select>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        {actionsForStatus(status).map((action) => (
          <Button
            key={action}
            variant={action === "complete" ? "primary" : "secondary"}
            loading={isPending && pendingAction === action}
            disabled={action === "reserve" && !selectedBuyerId}
            onClick={() => runAction(action)}
            className={action === "complete" ? "shadow-[0_12px_24px_rgba(0,57,166,0.14)]" : ""}
          >
            {ACTION_COPY[action].label}
          </Button>
        ))}
      </div>
    </div>
  );
}

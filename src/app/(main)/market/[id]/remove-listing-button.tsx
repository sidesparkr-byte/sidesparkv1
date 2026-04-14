"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { useToast } from "@/components/ui";

export type RemoveListingStatus = "active" | "reserved" | "completed";

type RemoveListingButtonProps = {
  listingId: string;
  status: RemoveListingStatus;
};

type RemoveListingModalProps = {
  listingId: string;
  status: RemoveListingStatus;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (listingId: string) => void;
};

export function RemoveListingButton({ listingId, status }: RemoveListingButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex min-h-11 w-full items-center justify-center gap-1.5 text-center text-sm font-medium text-[#DC2626]"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2} />
        <span>Remove listing</span>
      </button>

      <RemoveListingModal
        listingId={listingId}
        status={status}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={() => {
          router.push("/profile");
          router.refresh();
        }}
      />
    </>
  );
}

export function RemoveListingModal({
  listingId,
  status,
  isOpen,
  onClose,
  onSuccess
}: RemoveListingModalProps) {
  const { showToast } = useToast();
  const [isRemoving, setIsRemoving] = useState(false);

  async function handleRemove() {
    if (isRemoving) return;

    setIsRemoving(true);
    try {
      const response = await fetch("/api/listings/remove", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ listingId })
      });

      const data = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to remove listing.");
      }

      showToast("Listing removed.", {
        variant: "success",
        title: "Removed"
      });
      onClose();
      onSuccess?.(listingId);
    } catch (error) {
      onClose();
      showToast(error instanceof Error ? error.message : "Unable to remove listing.", {
        variant: "error",
        title: "Remove failed"
      });
    } finally {
      setIsRemoving(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40">
      <div className="w-full rounded-t-2xl bg-white p-6 pb-[calc(24px+env(safe-area-inset-bottom))]">
        <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-[#D1D5DB]" />
        <h2 className="text-center text-base font-semibold text-[#1A1A1A]">
          Remove this listing?
        </h2>
        <p className="mt-2 text-center text-sm text-[#6B6B6B]">
          This removes it from the marketplace. You can relist anytime.
        </p>

        {status === "reserved" ? (
          <div className="mt-4 rounded-lg border border-[#FCD34D] bg-[#FFFBEB] px-3.5 py-2.5">
            <p className="text-[13px] text-[#92400E]">
              A buyer has already reserved this item.
            </p>
          </div>
        ) : null}

        <div className="mt-6 space-y-2">
          <button
            type="button"
            onClick={handleRemove}
            disabled={isRemoving}
            className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[#DC2626] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-80"
          >
            {isRemoving ? "Removing..." : "Yes, remove it"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isRemoving}
            className="flex min-h-[52px] w-full items-center justify-center rounded-xl border-2 border-[#E5E5E5] bg-white px-4 text-sm font-semibold text-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-80"
          >
            Keep listing
          </button>
        </div>
      </div>
    </div>
  );
}

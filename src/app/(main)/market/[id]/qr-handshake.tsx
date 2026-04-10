"use client";

import { useCallback, useEffect, useState } from "react";

import QRCode from "react-qr-code";

import { Button, Modal } from "@/components/ui";

type QRHandshakeProps = {
  listingId: string;
  isOpen: boolean;
  onClose: () => void;
};

type SellerQrCodeButtonProps = {
  listingId: string;
  reservedBuyerFirstName?: string | null;
};

type TransactionCreateResponse = {
  success?: boolean;
  transactionId?: string;
  qrToken?: string;
  error?: string;
};

function QrGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M4 4h5v5H4V4Zm11 0h5v5h-5V4ZM4 15h5v5H4v-5Zm8-8h2v2h-2V7Zm0 4h2v2h-2v-2Zm2 2h2v2h-2v-2Zm2-6h2v2h-2V7Zm0 8h4v2h-2v2h-2v-4Zm-4 4h2v2h-2v-2Zm4 2h2v2h-2v-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function QRHandshake({ listingId, isOpen, onClose }: QRHandshakeProps) {
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createTransaction = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/transactions/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ listingId })
      });

      const data = (await response.json().catch(() => ({}))) as TransactionCreateResponse;

      if (!response.ok || !data.success || !data.transactionId || !data.qrToken) {
        throw new Error(data.error || "Unable to generate a QR code right now.");
      }

      setTransactionId(data.transactionId);
      setQrToken(data.qrToken);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to generate a QR code right now."
      );
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    if (!isOpen || loading || qrToken || transactionId) {
      return;
    }

    void createTransaction();
  }, [createTransaction, isOpen, loading, qrToken, transactionId]);

  useEffect(() => {
    setError(null);
    setQrToken(null);
    setTransactionId(null);
  }, [listingId]);

  return (
    <Modal open={isOpen} onClose={onClose} className="rounded-t-2xl px-6 pb-[calc(24px+env(safe-area-inset-bottom))] pt-3">
      <div className="space-y-5 pb-2 pt-1">
        <div className="space-y-2 text-center">
          <h2 className="font-heading text-[20px] font-bold text-[var(--color-text-primary)]">
            Show this to your buyer
          </h2>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)]/20 border-t-[var(--color-primary)]" />
            <p className="text-sm text-[var(--color-text-secondary)]">Generating secure pickup QR code…</p>
          </div>
        ) : error ? (
          <div className="space-y-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-5 text-center">
            <p className="text-sm font-medium text-red-700">{error}</p>
            <Button
              variant="secondary"
              onClick={() => void createTransaction()}
              className="border-red-200 bg-white text-red-700 hover:bg-red-100"
            >
              Retry
            </Button>
          </div>
        ) : qrToken && transactionId ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.10)]">
                <QRCode value={qrToken} size={200} fgColor="#0039A6" bgColor="#FFFFFF" />
              </div>
            </div>
            <div className="space-y-1 text-center">
              <p className="text-[13px] text-[var(--color-text-muted)]">
                Have your buyer scan this at pickup
              </p>
              <p className="font-mono text-[11px] text-[var(--color-text-muted)]">
                ID: {transactionId.slice(0, 8)}
              </p>
            </div>
          </div>
        ) : null}

        <div className="flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-[var(--color-text-muted)] transition hover:text-[var(--color-text-secondary)]"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function SellerQrCodeButton({
  listingId,
  reservedBuyerFirstName
}: SellerQrCodeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="primary"
        onClick={() => setIsOpen(true)}
        className="min-h-[52px] rounded-xl shadow-[0_10px_24px_rgba(0,57,166,0.18)]"
      >
        <>
          <QrGlyph />
          Show QR Code
        </>
      </Button>
      <p className="text-center text-[13px] text-[var(--color-text-muted)]">
        Reserved by {reservedBuyerFirstName || "buyer"}
      </p>
      <QRHandshake listingId={listingId} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

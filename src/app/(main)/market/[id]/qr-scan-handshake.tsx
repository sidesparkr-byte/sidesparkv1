"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button, Modal, useToast } from "@/components/ui";

type BuyerQrScanHandshakeProps = {
  listingId: string;
  isOpen: boolean;
  onClose: () => void;
};

type BuyerScanButtonProps = {
  listingId: string;
};

type VerifyResponse = {
  success?: boolean;
  transactionId?: string;
  completed?: boolean;
  error?: string;
};

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
};

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats?: string[] }) => BarcodeDetectorLike;
  }
}

function ScanGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M7 4H5a1 1 0 0 0-1 1v2m13-3h2a1 1 0 0 1 1 1v2M4 17v2a1 1 0 0 0 1 1h2m13-3v2a1 1 0 0 1-1 1h-2M8 8h8v8H8V8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BuyerQrScanHandshake({
  listingId,
  isOpen,
  onClose
}: BuyerQrScanHandshakeProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const scanFrameRef = useRef<number | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [startingCamera, setStartingCamera] = useState(false);

  const barcodeSupported = useMemo(
    () => typeof window !== "undefined" && typeof window.BarcodeDetector === "function",
    []
  );

  const stopCamera = useCallback(() => {
    if (scanFrameRef.current) {
      window.clearTimeout(scanFrameRef.current);
      scanFrameRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraReady(false);
  }, []);

  const completeHandshake = useCallback(
    async (qrToken: string) => {
      if (!qrToken || submitting) {
        return;
      }

      setSubmitting(true);
      try {
        const response = await fetch("/api/transactions/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            listingId,
            qrToken
          })
        });

        const data = (await response.json().catch(() => ({}))) as VerifyResponse;

        if (!response.ok || !data.success || !data.transactionId) {
          throw new Error(data.error || "Unable to verify this QR code.");
        }

        stopCamera();
        showToast("Pickup confirmed. This transaction is now complete.", {
          variant: "success",
          title: "Transaction complete"
        });
        onClose();
        router.refresh();
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Unable to verify this QR code.", {
          variant: "error",
          title: "Verification failed"
        });
      } finally {
        setSubmitting(false);
      }
    },
    [listingId, onClose, router, showToast, stopCamera, submitting]
  );

  const scanFrame = useCallback(async () => {
    if (!videoRef.current || !detectorRef.current || submitting) {
      return;
    }

    try {
      const codes = await detectorRef.current.detect(videoRef.current);
      const firstCode = codes.find((code) => typeof code.rawValue === "string" && code.rawValue.trim());

      if (firstCode?.rawValue) {
        void completeHandshake(firstCode.rawValue.trim());
        return;
      }
    } catch {
      // Keep scanning; camera/manual fallback covers unsupported cases.
    }

    scanFrameRef.current = window.setTimeout(() => {
      void scanFrame();
    }, 450);
  }, [completeHandshake, submitting]);

  const startCamera = useCallback(async () => {
    if (!barcodeSupported || startingCamera) {
      return;
    }

    setStartingCamera(true);
    setCameraError(null);

    try {
      const BarcodeDetectorCtor = window.BarcodeDetector;
      if (!BarcodeDetectorCtor) {
        throw new Error("QR scanning is not supported on this device.");
      }

      const detector = new BarcodeDetectorCtor({
        formats: ["qr_code"]
      });

      detectorRef.current = detector;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: "environment"
          }
        },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraReady(true);
      void scanFrame();
    } catch (error) {
      setCameraError(
        error instanceof Error
          ? error.message
          : "Camera access failed. You can still paste the code manually."
      );
      stopCamera();
    } finally {
      setStartingCamera(false);
    }
  }, [barcodeSupported, scanFrame, startingCamera, stopCamera]);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setTokenInput("");
      setCameraError(null);
      return;
    }

    if (barcodeSupported) {
      void startCamera();
    } else {
      setCameraError("Camera scanning is not supported here. Paste the seller code manually.");
    }

    return () => {
      stopCamera();
    };
  }, [barcodeSupported, isOpen, startCamera, stopCamera]);

  return (
    <Modal
      open={isOpen}
      onClose={() => {
        stopCamera();
        onClose();
      }}
      className="rounded-t-2xl px-6 pb-[calc(24px+env(safe-area-inset-bottom))] pt-3"
    >
      <div className="space-y-5 pb-2 pt-1">
        <div className="space-y-2 text-center">
          <h2 className="font-heading text-[20px] font-bold text-[var(--color-text-primary)]">
            Scan seller QR code
          </h2>
          <p className="text-[13px] text-[var(--color-text-muted)]">
            Hold the seller QR inside the frame to confirm pickup.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl bg-[var(--color-surface)] p-3 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
          <div className="relative overflow-hidden rounded-2xl bg-black">
            <video
              ref={videoRef}
              className={`aspect-square w-full object-cover ${cameraReady ? "opacity-100" : "opacity-0"}`}
              playsInline
              muted
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-[70%] w-[70%] rounded-[28px] border-2 border-white/70 shadow-[0_0_0_999px_rgba(0,0,0,0.16)]" />
            </div>
            {!cameraReady ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[var(--color-surface)] px-6 text-center">
                {startingCamera ? (
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)]/20 border-t-[var(--color-primary)]" />
                ) : (
                  <ScanGlyph />
                )}
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {startingCamera ? "Starting camera…" : "Camera preview will appear here."}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {cameraError ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {cameraError}
          </p>
        ) : null}

        <div className="space-y-2">
          <label
            htmlFor="qr-token-input"
            className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]"
          >
            Manual code entry
          </label>
          <input
            id="qr-token-input"
            type="text"
            inputMode="text"
            value={tokenInput}
            onChange={(event) => setTokenInput(event.target.value)}
            placeholder="Paste seller QR code token"
            className="min-h-[52px] w-full rounded-xl border border-[var(--color-border)] bg-white px-4 text-base text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/15"
          />
        </div>

        <div className="space-y-3">
          <Button
            variant="primary"
            loading={submitting}
            onClick={() => void completeHandshake(tokenInput.trim())}
            disabled={!tokenInput.trim()}
            className="min-h-[52px] rounded-xl"
          >
            Verify Pickup
          </Button>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="text-sm font-medium text-[var(--color-text-muted)] transition hover:text-[var(--color-text-secondary)]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export function BuyerQrScanButton({ listingId }: BuyerScanButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="danger"
        onClick={() => setIsOpen(true)}
        className="min-h-[52px] rounded-xl shadow-[0_12px_28px_rgba(255,107,53,0.24)]"
      >
        <>
          <ScanGlyph />
          Scan Seller QR
        </>
      </Button>
      <p className="text-center text-[13px] text-[var(--color-text-muted)]">
        Scan the seller&apos;s QR code at pickup to complete the handoff.
      </p>
      <BuyerQrScanHandshake listingId={listingId} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

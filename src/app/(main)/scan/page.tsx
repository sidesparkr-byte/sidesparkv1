"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type PageState = "scanning" | "loading" | "success" | "error";

type CompleteResponse = {
  success?: boolean;
  transactionId?: string;
  sellerId?: string;
  buyerId?: string;
  listingTitle?: string;
  error?: string;
};

type Html5QrcodeScannerModule = typeof import("html5-qrcode");

function BackIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="m12.5 4.5-5 5 5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
      <path d="m6 12.5 4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
      <path d="m7 7 10 10M17 7 7 17" strokeLinecap="round" />
    </svg>
  );
}

export default function ScanPage() {
  const router = useRouter();
  const scannerRef = useRef<any>(null);
  const hasScanned = useRef(false);
  const [pageState, setPageState] = useState<PageState>("scanning");
  const [errorMessage, setErrorMessage] = useState("");
  const [transactionData, setTransactionData] = useState<CompleteResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    let scanner: any = null;
    let html5QrcodeModule: Html5QrcodeScannerModule | null = null;

    const stopScanner = async () => {
      if (!scanner) {
        return;
      }

      try {
        await scanner.stop();
      } catch {
        // ignore stop errors during teardown
      }

      try {
        await scanner.clear();
      } catch {
        // ignore clear errors during teardown
      }
    };

    const handleScanSuccess = async (decodedText: string) => {
      if (hasScanned.current) {
        return;
      }
      hasScanned.current = true;

      try {
        await scanner.stop();
      } catch (e) {
        void e;
      }

      setPageState("loading");

      const timeoutId = window.setTimeout(() => {
        setErrorMessage("Request timed out. Try again.");
        setPageState("error");
        hasScanned.current = false;
      }, 15000);

      try {
        const response = await fetch("/api/transactions/complete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ qrToken: decodedText })
        });

        window.clearTimeout(timeoutId);
        const data = (await response.json()) as CompleteResponse;

        if (!response.ok) {
          throw new Error(data.error || "Something went wrong");
        }

        setTransactionData(data);
        setPageState("success");

        window.setTimeout(() => {
          router.push(`/rate/${data.transactionId}`);
        }, 1500);
      } catch (error) {
        window.clearTimeout(timeoutId);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not confirm the trade. Try again."
        );
        setPageState("error");
        hasScanned.current = false;
      }
    };

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) {
          return;
        }

        html5QrcodeModule = await import("html5-qrcode");
        void html5QrcodeModule;
        scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText: string) => {
            void handleScanSuccess(decodedText);
          }
        );
      } catch (error) {
        if (cancelled) {
          return;
        }
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "We couldn't start the camera scanner."
        );
        setPageState("error");
      }
    };

    if (pageState === "scanning") {
      void startScanner();
    }

    return () => {
      cancelled = true;
      void stopScanner();
      scannerRef.current = null;
    };
  }, [pageState, router]);

  useEffect(() => {
    return () => {
      hasScanned.current = false;
    };
  }, []);

  if (pageState === "loading") {
    return (
      <div className="-mx-4 -my-3 flex min-h-[100dvh] items-center justify-center overflow-x-hidden bg-white px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(24px,env(safe-area-inset-top))]">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-primary)]/15 border-t-[var(--color-primary)]" />
          <p className="text-sm text-[var(--color-text-muted)]">Confirming transaction...</p>
        </div>
      </div>
    );
  }

  if (pageState === "success") {
    return (
      <div className="-mx-4 -my-3 flex min-h-[100dvh] items-center justify-center overflow-x-hidden bg-white px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(24px,env(safe-area-inset-top))]">
        <div className="flex max-w-[280px] flex-col items-center gap-4 text-center">
          <div className="flex h-[72px] w-[72px] animate-[scale-in_300ms_ease-out] items-center justify-center rounded-full bg-[var(--color-success)] text-white">
            <CheckIcon />
          </div>
          <h1 className="font-heading text-[24px] font-bold text-[var(--color-text-primary)]">
            Handshake Complete ✓
          </h1>
          <p className="max-w-[240px] text-sm text-[var(--color-text-muted)]">
            {transactionData?.listingTitle ?? "Item"} picked up successfully
          </p>
        </div>
      </div>
    );
  }

  if (pageState === "error") {
    return (
      <div className="-mx-4 -my-3 flex min-h-[100dvh] items-center justify-center overflow-x-hidden bg-white px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(24px,env(safe-area-inset-top))]">
        <div className="flex max-w-[280px] flex-col items-center gap-4 text-center">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#DC2626] text-white">
            <XIcon />
          </div>
          <div className="space-y-2">
            <h1 className="font-heading text-[24px] font-bold text-[var(--color-text-primary)]">
              Something went wrong
            </h1>
            <p className="text-[13px] text-[var(--color-text-muted)]">{errorMessage}</p>
          </div>
          <div className="w-full space-y-3">
            <button
              type="button"
              onClick={() => {
                hasScanned.current = false;
                setErrorMessage("");
                setPageState("scanning");
              }}
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(0,57,166,0.18)] transition hover:bg-[var(--color-primary-dark)]"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="text-sm font-medium text-[var(--color-text-muted)]"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-4 -my-3 min-h-[100dvh] bg-black text-white">
      <style jsx>{`
        @keyframes scan-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
      <div className="relative min-h-[100dvh] overflow-hidden bg-black">
        <div className="pointer-events-none absolute inset-0 z-0" id="qr-reader" />

        <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-4 pb-4 pt-[max(16px,env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-white"
            aria-label="Go back"
          >
            <BackIcon />
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 font-heading text-[18px] font-semibold text-white">
            Scan QR Code
          </h1>
          <div className="min-h-11 min-w-11" aria-hidden="true" />
        </div>

        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6">
          <div className="relative h-[220px] w-[220px]">
            <div className="absolute inset-0 rounded-[12px] border-[4px] border-[#0039A6]" style={{ animation: "scan-pulse 1.2s ease-in-out infinite" }} />
            <div className="absolute bottom-full left-1/2 h-[999px] w-[999px] -translate-x-1/2 rounded-full bg-black/55" />
            <div className="absolute left-full top-1/2 h-[999px] w-[999px] -translate-y-1/2 rounded-full bg-black/55" />
            <div className="absolute right-full top-1/2 h-[999px] w-[999px] -translate-y-1/2 rounded-full bg-black/55" />
            <div className="absolute top-full left-1/2 h-[999px] w-[999px] -translate-x-1/2 rounded-full bg-black/55" />
          </div>
          <p className="mt-6 max-w-[260px] text-center text-sm text-white">
            Point your camera at the seller&apos;s QR code
          </p>
        </div>
      </div>
    </div>
  );
}

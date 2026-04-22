"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="m6 6 8 8m0-8-8 8" strokeLinecap="round" />
    </svg>
  );
}

export function FeedbackButton() {
  const pathname = usePathname();
  const closeTimerRef = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setMessage("");
      setSubmitting(false);
      setError(null);
      setSuccessMessage(null);
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    }
  }, [open]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      setError("Please share a quick note before submitting.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: trimmedMessage,
          page: pathname
        })
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to submit feedback right now.");
      }

      setSuccessMessage(
        "You're the best, thanks for helping us improve the app before launch!"
      );
      closeTimerRef.current = window.setTimeout(() => {
        setOpen(false);
      }, 3000);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit feedback right now."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative inline-flex h-8 w-[86px] shrink-0 items-center justify-center overflow-hidden whitespace-nowrap rounded-full bg-[#0039A6] px-3 py-1.5 text-xs font-medium leading-none text-white shadow-[0_4px_12px_rgba(0,57,166,0.22)] [writing-mode:horizontal-tb]"
        style={{ textOrientation: "mixed", WebkitTextSizeAdjust: "100%" }}
        aria-label="Open feedback form"
      >
        <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0)_100%)]" />
        <span className="relative block w-full whitespace-nowrap text-center [writing-mode:horizontal-tb]">
          Feedback
        </span>
      </button>

      {mounted && open
        ? createPortal(
            <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4">
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Send feedback"
                className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-[#1A1A1A]">Feedback</h2>
                    <p className="mt-1 text-xs text-[#6B6B6B]">
                      Tell us what would make SideSpark better.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-[#6B6B6B]"
                    aria-label="Close feedback modal"
                  >
                    <CloseIcon />
                  </button>
                </div>

                {successMessage ? (
                  <div className="rounded-2xl bg-[#EEF2FF] px-4 py-5 text-center text-sm leading-6 text-[#0039A6]">
                    {successMessage}
                  </div>
                ) : (
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <textarea
                      value={message}
                      onChange={(event) => {
                        setMessage(event.target.value);
                        if (error) {
                          setError(null);
                        }
                      }}
                      placeholder="What's on your mind?"
                      rows={5}
                      className="min-h-[140px] w-full rounded-2xl border border-[#E5E5E5] px-4 py-3 text-base text-[#1A1A1A] outline-none placeholder:text-[#9A9A9A] focus:border-[#0039A6]"
                    />

                    {error ? <p className="text-sm text-[#DC2626]">{error}</p> : null}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[#0039A6] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-80"
                    >
                      {submitting ? "Sending..." : "Submit"}
                    </button>
                  </form>
                )}
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}

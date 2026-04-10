"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle, Eye, EyeOff, Loader2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { getSession, updatePassword } from "@/lib/auth";

type PageState = "loading" | "form" | "success" | "expired";

function Spinner() {
  return <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />;
}

function PasswordField({
  id,
  label,
  placeholder,
  value,
  onChange,
  isVisible,
  onToggleVisibility
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  isVisible: boolean;
  onToggleVisibility: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[12px] font-medium text-[var(--color-text-primary)]">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isVisible ? "text" : "password"}
          autoComplete="new-password"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-[52px] w-full rounded-xl bg-[var(--color-surface)] px-4 py-3.5 pr-12 text-base text-[var(--color-text-primary)] outline-none ring-0 placeholder:text-[#9A9A9A] focus:outline focus:outline-2 focus:outline-[var(--color-primary)]"
          required
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-[#9A9A9A]"
          aria-label={isVisible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {isVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}

function getStrength(newPassword: string) {
  if (newPassword.length < 8) {
    return { width: "20%", color: "#DC2626", label: "Too short" };
  }

  const hasLetter = /[a-z]/i.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSymbol = /[^A-Za-z0-9]/.test(newPassword);

  if (newPassword.length >= 12 && hasNumber && hasSymbol) {
    return { width: "100%", color: "#2D9B6F", label: "Strong" };
  }

  if (hasLetter && (hasNumber || hasSymbol)) {
    return { width: "70%", color: "#0039A6", label: "Good" };
  }

  return { width: "40%", color: "#F59E0B", label: "Weak" };
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successVisible, setSuccessVisible] = useState(false);

  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const hasConfirmPasswordValue = confirmPassword.length > 0;
  const strength = useMemo(() => getStrength(newPassword), [newPassword]);
  const isSubmitDisabled =
    isLoading || newPassword.length < 8 || confirmPassword.length === 0 || !passwordsMatch;

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      const session = await getSession();

      if (!isMounted) {
        return;
      }

      setPageState(session ? "form" : "expired");
    }

    void loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (pageState !== "success") {
      setSuccessVisible(false);
      return;
    }

    const visibilityTimer = window.setTimeout(() => setSuccessVisible(true), 10);
    const redirectTimer = window.setTimeout(() => router.push("/"), 2000);

    return () => {
      window.clearTimeout(visibilityTimer);
      window.clearTimeout(redirectTimer);
    };
  }, [pageState, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!passwordsMatch) {
      setError("Passwords don't match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await updatePassword(newPassword);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    setPageState("success");
  }

  return (
    <main className="min-h-screen bg-white px-6 text-[var(--color-text-primary)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[360px] flex-col justify-center py-12">
        {pageState === "loading" ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner />
          </div>
        ) : null}

        {pageState === "expired" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-error-bg,#FEF2F2)]">
              <XCircle className="h-8 w-8 text-[var(--color-error-text,#DC2626)]" />
            </div>
            <div className="space-y-2">
              <h1 className="font-[var(--font-heading)] text-[22px] font-bold text-[var(--color-text-primary)]">
                Reset link expired
              </h1>
              <p className="text-sm text-[var(--color-text-secondary)]">
                This link has expired or has already been used.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="mt-2 flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 py-3 text-base font-semibold text-white"
            >
              <span className="font-[var(--font-heading)]">Request a new link</span>
            </button>
          </div>
        ) : null}

        {pageState === "form" ? (
          <div className="flex flex-1 flex-col justify-center">
            <div className="space-y-1 text-center">
              <h1 className="font-[var(--font-heading)] text-[28px] font-bold leading-none text-[var(--color-primary)]">
                SideSpark
              </h1>
            </div>

            <div className="mt-8 space-y-2 text-center">
              <h2 className="font-[var(--font-heading)] text-[22px] font-bold text-[var(--color-text-primary)]">
                Set a new password
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Choose a strong password for your SideSpark account
              </p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <PasswordField
                  id="new-password"
                  label="New Password"
                  placeholder="Min. 8 characters"
                  value={newPassword}
                  onChange={(value) => {
                    setNewPassword(value);
                    if (error) {
                      setError(null);
                    }
                  }}
                  isVisible={showNewPassword}
                  onToggleVisibility={() => setShowNewPassword((current) => !current)}
                />

                <div className="space-y-1">
                  <div className="h-1 w-full overflow-hidden rounded-[2px] bg-[var(--color-surface)]">
                    <div
                      className="h-full rounded-[2px] transition-all duration-300 ease-in-out"
                      style={{
                        width: strength.width,
                        backgroundColor: strength.color
                      }}
                    />
                  </div>
                  <p
                    className="text-right text-[11px] font-medium"
                    style={{ color: strength.color }}
                  >
                    {strength.label}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <PasswordField
                  id="confirm-password"
                  label="Confirm Password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(value) => {
                    setConfirmPassword(value);
                    if (error) {
                      setError(null);
                    }
                  }}
                  isVisible={showConfirmPassword}
                  onToggleVisibility={() => setShowConfirmPassword((current) => !current)}
                />

                {hasConfirmPasswordValue ? (
                  passwordsMatch ? (
                    <p className="mt-1 text-[12px] text-[var(--color-success)]">Passwords match ✓</p>
                  ) : (
                    <p className="mt-1 text-[12px] text-[var(--color-error-text,#DC2626)]">
                      Passwords don&apos;t match
                    </p>
                  )
                ) : null}
              </div>

              <button
                type="submit"
                disabled={isSubmitDisabled}
                className={`mt-6 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-semibold transition-colors ${
                  isSubmitDisabled
                    ? "cursor-not-allowed bg-[var(--color-border)] text-[#9A9A9A]"
                    : "bg-[var(--color-primary)] text-white"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-[18px] w-[18px] animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <span className="font-[var(--font-heading)]">Update Password</span>
                )}
              </button>

              {error ? (
                <div className="mt-3 rounded-lg border border-[var(--color-error-border,#FECACA)] bg-[var(--color-error-bg,#FEF2F2)] px-3.5 py-2.5 text-[13px] text-[var(--color-error-text,#DC2626)]">
                  {error}
                </div>
              ) : null}
            </form>
          </div>
        ) : null}

        {pageState === "success" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <div
              className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[var(--color-success-bg,#EEFAF4)] transition-all duration-300 ease-out"
              style={{
                transform: successVisible ? "scale(1)" : "scale(0.5)",
                opacity: successVisible ? 1 : 0
              }}
            >
              <CheckCircle className="h-9 w-9 text-[var(--color-success)]" />
            </div>
            <div className="space-y-2">
              <h1 className="font-[var(--font-heading)] text-[24px] font-bold text-[var(--color-text-primary)]">
                Password updated!
              </h1>
              <p className="text-sm text-[var(--color-text-secondary)]">
                You&apos;re all set. You&apos;ll be redirected to your feed now.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-2 flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 py-3 text-base font-semibold text-white"
            >
              <span className="font-[var(--font-heading)]">Go to Feed</span>
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}

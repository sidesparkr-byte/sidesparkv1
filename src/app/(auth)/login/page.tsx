"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import { CheckCircle, ChevronLeft, Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { useToast } from "@/components/ui/toast";
import { sendPasswordReset, signIn, signUp } from "@/lib/auth";

type AuthMode = "signin" | "signup";
type View = "form" | "forgot" | "forgot_sent";

function getCallbackError(error?: string | null) {
  if (error === "auth_callback") {
    return "Your sign-in link expired or is invalid. Request a new one.";
  }

  if (error === "domain") {
    return "SideSpark is for Butler students only.";
  }

  if (error === "auth_browser") {
    return "Open the sign-in link in the same browser window where you requested it.";
  }

  return null;
}

function Spinner() {
  return (
    <span
      className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
      aria-hidden="true"
    />
  );
}

function PasswordField({
  id,
  label,
  placeholder,
  value,
  onChange,
  autoComplete,
  isVisible,
  onToggleVisibility
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
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
          autoComplete={autoComplete}
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

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const callbackError = useMemo(
    () => getCallbackError(searchParams.get("error")),
    [searchParams]
  );

  const [mode, setMode] = useState<AuthMode>("signin");
  const [view, setView] = useState<View>("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(callbackError);

  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const hasConfirmPasswordValue = confirmPassword.length > 0;
  const signUpDisabled =
    isLoading || email.trim().length === 0 || password.length === 0 || confirmPassword.length === 0 || !passwordsMatch;

  function resetAuthState(nextMode: AuthMode) {
    setMode(nextMode);
    setView("form");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShowSignInPassword(false);
    setShowSignUpPassword(false);
    setShowConfirmPassword(false);
    setIsLoading(false);
    setForgotEmail("");
    setError(nextMode === "signin" ? callbackError : null);
  }

  async function handleSignInSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await signIn(email, password);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    router.push("/");
  }

  async function handleSignUpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!passwordsMatch) {
      setError("Passwords don't match");
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await signUp(email, password);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    setMode("signin");
    setView("form");
    setPassword("");
    setConfirmPassword("");
    setIsLoading(false);
    showToast("Account created. You can sign in now.", {
      title: "Welcome to SideSpark",
      variant: "success"
    });
  }

  return (
    <main className="min-h-screen bg-white px-6 text-[var(--color-text-primary)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[360px] flex-col pt-12">
        <div className="mt-12 space-y-1 text-center">
          <h1 className="font-[var(--font-heading)] text-[28px] font-bold leading-none text-[var(--color-primary)]">
            SideSpark
          </h1>
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            Butler University Marketplace
          </p>
        </div>

        <div className="mt-8 grid w-full grid-cols-2 gap-2 rounded-full bg-white">
          <button
            type="button"
            onClick={() => resetAuthState("signin")}
            className={`min-h-10 rounded-full px-4 text-sm font-semibold transition-all duration-150 ease-in-out ${
              mode === "signin"
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-surface)] text-[var(--color-text-secondary)]"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => resetAuthState("signup")}
            className={`min-h-10 rounded-full px-4 text-sm font-semibold transition-all duration-150 ease-in-out ${
              mode === "signup"
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-surface)] text-[var(--color-text-secondary)]"
            }`}
          >
            Sign Up
          </button>
        </div>

        <div className="flex flex-1 flex-col justify-center py-12">
          {mode === "signin" && view === "form" ? (
            <form className="space-y-5" onSubmit={handleSignInSubmit}>
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-[12px] font-medium text-[var(--color-text-primary)]"
                >
                  Butler Email
                </label>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@butler.edu"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (error) {
                      setError(null);
                    }
                  }}
                  className="min-h-[52px] w-full rounded-xl bg-[var(--color-surface)] px-4 py-3.5 text-base text-[var(--color-text-primary)] outline-none ring-0 placeholder:text-[#9A9A9A] focus:outline focus:outline-2 focus:outline-[var(--color-primary)]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <PasswordField
                  id="password"
                  label="Password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(value) => {
                    setPassword(value);
                    if (error) {
                      setError(null);
                    }
                  }}
                  autoComplete="current-password"
                  isVisible={showSignInPassword}
                  onToggleVisibility={() => setShowSignInPassword((current) => !current)}
                />
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setIsLoading(false);
                      setForgotEmail(email);
                      setView("forgot");
                    }}
                    className="min-h-11 px-1 text-[13px] text-[var(--color-primary)] underline underline-offset-2"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-6 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-3 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-80"
              >
                {isLoading ? (
                  <>
                    <Spinner />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span className="font-[var(--font-heading)]">Sign In</span>
                )}
              </button>

              {error ? (
                <div className="mt-3 rounded-lg border border-[var(--color-error-border,#FECACA)] bg-[var(--color-error-bg,#FEF2F2)] px-3.5 py-2.5 text-[13px] text-[var(--color-error-text,#DC2626)]">
                  {error}
                </div>
              ) : null}
            </form>
          ) : null}

          {mode === "signup" && view === "form" ? (
            <form className="space-y-5" onSubmit={handleSignUpSubmit}>
              <div className="space-y-1.5">
                <label
                  htmlFor="signup-email"
                  className="block text-[12px] font-medium text-[var(--color-text-primary)]"
                >
                  Butler Email
                </label>
                <input
                  id="signup-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@butler.edu"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (error) {
                      setError(null);
                    }
                  }}
                  className="min-h-[52px] w-full rounded-xl bg-[var(--color-surface)] px-4 py-3.5 text-base text-[var(--color-text-primary)] outline-none ring-0 placeholder:text-[#9A9A9A] focus:outline focus:outline-2 focus:outline-[var(--color-primary)]"
                  required
                />
              </div>

              <PasswordField
                id="signup-password"
                label="Create Password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(value) => {
                  setPassword(value);
                  if (error) {
                    setError(null);
                  }
                }}
                autoComplete="new-password"
                isVisible={showSignUpPassword}
                onToggleVisibility={() => setShowSignUpPassword((current) => !current)}
              />

              <div className="space-y-1.5">
                <PasswordField
                  id="confirm-password"
                  label="Confirm Password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(value) => {
                    setConfirmPassword(value);
                    if (error) {
                      setError(null);
                    }
                  }}
                  autoComplete="new-password"
                  isVisible={showConfirmPassword}
                  onToggleVisibility={() => setShowConfirmPassword((current) => !current)}
                />

                {hasConfirmPasswordValue ? (
                  passwordsMatch ? (
                    <p className="text-[12px] text-[var(--color-success)]">Passwords match ✓</p>
                  ) : (
                    <p className="text-[12px] text-[var(--color-error-text,#DC2626)]">
                      Passwords don&apos;t match
                    </p>
                  )
                ) : null}
              </div>

              <button
                type="submit"
                disabled={signUpDisabled}
                className={`mt-6 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-semibold transition-colors ${
                  signUpDisabled
                    ? "cursor-not-allowed bg-[var(--color-border)] text-[#9A9A9A]"
                    : "bg-[var(--color-primary)] text-white"
                }`}
              >
                {isLoading ? (
                  <>
                    <Spinner />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <span className="font-[var(--font-heading)]">Create Account</span>
                )}
              </button>

              {error ? (
                <div className="mt-3 rounded-lg border border-[var(--color-error-border,#FECACA)] bg-[var(--color-error-bg,#FEF2F2)] px-3.5 py-2.5 text-[13px] text-[var(--color-error-text,#DC2626)]">
                  {error}
                </div>
              ) : null}
            </form>
          ) : null}

          {view === "forgot" ? (
            <div className="flex flex-1 flex-col">
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setError(mode === "signin" ? callbackError : null);
                    setIsLoading(false);
                    setView("form");
                  }}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--color-text-primary)]"
                  aria-label="Back"
                >
                  <ChevronLeft className="h-[22px] w-[22px]" />
                </button>
              </div>

              <div className="space-y-2">
                <h2 className="font-[var(--font-heading)] text-[22px] font-bold text-[var(--color-text-primary)]">
                  Reset Password
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Enter your Butler email and we&apos;ll send you a reset link
                </p>
              </div>

              <form
                className="mt-6 space-y-5"
                onSubmit={async (event) => {
                  event.preventDefault();
                  setIsLoading(true);
                  setError(null);
                  await sendPasswordReset(forgotEmail);
                  setIsLoading(false);
                  setView("forgot_sent");
                }}
              >
                <div className="space-y-1.5">
                  <label
                    htmlFor="forgot-email"
                    className="block text-[12px] font-medium text-[var(--color-text-primary)]"
                  >
                    Butler Email
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@butler.edu"
                    value={forgotEmail}
                    onChange={(event) => setForgotEmail(event.target.value)}
                    className="min-h-[52px] w-full rounded-xl bg-[var(--color-surface)] px-4 py-3.5 text-base text-[var(--color-text-primary)] outline-none ring-0 placeholder:text-[#9A9A9A] focus:outline focus:outline-2 focus:outline-[var(--color-primary)]"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-6 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-3 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-80"
                >
                  {isLoading ? (
                    <>
                      <Spinner />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span className="font-[var(--font-heading)]">Send Reset Link</span>
                  )}
                </button>
              </form>
            </div>
          ) : null}

          {view === "forgot_sent" ? (
            <div className="flex flex-1 flex-col justify-center">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#EEFAF4]">
                  <CheckCircle className="h-9 w-9 text-[var(--color-success)]" />
                </div>
                <div className="space-y-2">
                  <h2 className="font-[var(--font-heading)] text-[20px] font-bold text-[var(--color-text-primary)]">
                    Reset link sent!
                  </h2>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    If {forgotEmail} has a SideSpark account, you&apos;ll receive a reset link
                    shortly.
                  </p>
                  <p className="text-[12px] text-[#9A9A9A]">
                    Check your spam folder if you don&apos;t see it.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setForgotEmail("");
                  setView("form");
                  setMode("signin");
                  setError(callbackError);
                }}
                className="mt-6 flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 py-3 text-base font-semibold text-white"
              >
                <span className="font-[var(--font-heading)]">Back to Sign In</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-white" />}>
      <LoginPageContent />
    </Suspense>
  );
}

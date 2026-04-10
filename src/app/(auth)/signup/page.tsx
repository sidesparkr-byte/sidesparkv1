import { LoginClient } from "@/app/(auth)/login/login-client";

type SignupPageProps = {
  searchParams?: {
    error?: string;
    next?: string;
  };
};

export default function SignupPage({ searchParams }: SignupPageProps) {
  const callbackError = (() => {
    if (searchParams?.error === "auth_callback") {
      return "Your sign-in link expired or is invalid. Request a new one.";
    }

    if (searchParams?.error === "domain") {
      return "SideSpark is for Butler students only.";
    }

    return null;
  })();

  return (
    <LoginClient
      callbackError={callbackError}
      mode="signup"
      nextPath={searchParams?.next ?? null}
    />
  );
}

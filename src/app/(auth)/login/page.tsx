import { LoginClient } from "@/app/(auth)/login/login-client";

type LoginPageProps = {
  searchParams?: {
    error?: string;
    next?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const callbackError = (() => {
    if (searchParams?.error === "auth_callback") {
      return "Your sign-in link expired or is invalid. Request a new one.";
    }

    if (searchParams?.error === "domain") {
      return "SideSpark is for Butler students only.";
    }

    if (searchParams?.error === "auth_browser") {
      return "Open the sign-in link in the same browser window where you requested it.";
    }

    return null;
  })();

  return <LoginClient callbackError={callbackError} nextPath={searchParams?.next ?? null} />;
}

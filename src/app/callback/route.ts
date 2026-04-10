import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { isDevAnyEmailDomainEnabled } from "@/lib/dev-preview";
import { createClient } from "@/lib/supabase/server";

function isButlerEmail(email?: string | null) {
  return typeof email === "string" && email.toLowerCase().endsWith("@butler.edu");
}

function normalizeNextPath(nextPath?: string | null) {
  if (!nextPath || typeof nextPath !== "string") {
    return null;
  }
  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return null;
  }
  if (
    nextPath.startsWith("/login") ||
    nextPath.startsWith("/signup") ||
    nextPath.startsWith("/verify") ||
    nextPath.startsWith("/callback")
  ) {
    return null;
  }
  return nextPath;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const otpType = requestUrl.searchParams.get("type");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const nextPath = normalizeNextPath(requestUrl.searchParams.get("next"));

  if (errorDescription) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "auth_callback");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = createClient();
  let authError: Error | null = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    authError = error;
  } else if (tokenHash && otpType) {
    const { error } = await supabase.auth.verifyOtp({
      type: otpType as EmailOtpType,
      token_hash: tokenHash
    });
    authError = error;
  } else {
    authError = new Error("Missing auth callback parameters.");
  }

  if (authError) {
    const loginUrl = new URL("/login", request.url);
    const message = authError.message.toLowerCase();
    if (message.includes("code verifier")) {
      loginUrl.searchParams.set("error", "auth_browser");
    } else {
      loginUrl.searchParams.set("error", "auth_callback");
    }
    return NextResponse.redirect(loginUrl);
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!isDevAnyEmailDomainEnabled() && !isButlerEmail(user.email)) {
    await supabase.auth.signOut();
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "domain");
    return NextResponse.redirect(loginUrl);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name")
    .eq("id", user.id)
    .maybeSingle();

  const hasFirstName =
    typeof profile?.first_name === "string" && profile.first_name.trim().length > 0;

  if (!hasFirstName) {
    const onboardingUrl = new URL("/onboarding", request.url);
    if (nextPath) {
      onboardingUrl.searchParams.set("next", nextPath);
    }
    return NextResponse.redirect(onboardingUrl);
  }

  return NextResponse.redirect(new URL(nextPath ?? "/market", request.url));
}

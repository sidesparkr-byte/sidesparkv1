import { NextResponse, type NextRequest } from "next/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

import { isDevAnyEmailDomainEnabled, isDevQuickLoginEnabled } from "@/lib/dev-preview";

function getAdminEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  return { url, serviceRoleKey };
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

function normalizeEmail(value?: string | null) {
  if (!value || typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (!email) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

function allowedEmailsFromEnv() {
  const raw = process.env.DEV_QUICK_LOGIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

function isAllowedQuickLoginEmail(email: string) {
  const allowlist = allowedEmailsFromEnv();
  if (allowlist.length > 0) {
    return allowlist.includes(email);
  }

  if (isDevAnyEmailDomainEnabled()) {
    return true;
  }

  return email.endsWith("@butler.edu");
}

function redirectToQuickLogin(request: NextRequest, errorCode: string, email?: string | null) {
  const url = new URL("/dev/quick-login", request.url);
  url.searchParams.set("error", errorCode);
  if (email) {
    url.searchParams.set("email", email);
  }
  return NextResponse.redirect(url);
}

async function ensureUserExists(
  adminClient: any,
  email: string
) {
  const { error } = await adminClient.auth.admin.createUser({
    email,
    email_confirm: true
  });

  if (!error) {
    return;
  }

  const message = error.message.toLowerCase();
  const alreadyExists =
    message.includes("already registered") ||
    message.includes("already exists") ||
    message.includes("user already");

  if (!alreadyExists) {
    throw error;
  }
}

export async function GET(request: NextRequest) {
  if (!isDevQuickLoginEnabled()) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const requestUrl = new URL(request.url);
  const email = normalizeEmail(requestUrl.searchParams.get("email"));
  const nextPath = normalizeNextPath(requestUrl.searchParams.get("next"));

  if (!email) {
    return redirectToQuickLogin(request, "email_required");
  }

  if (!isAllowedQuickLoginEmail(email)) {
    return redirectToQuickLogin(request, "email_not_allowed", email);
  }

  try {
    const { url, serviceRoleKey } = getAdminEnv();
    const adminClient = createSupabaseAdminClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    await ensureUserExists(adminClient, email);

    const callbackUrl = new URL("/callback", request.url);
    if (nextPath) {
      callbackUrl.searchParams.set("next", nextPath);
    }

    const { data, error } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: callbackUrl.toString()
      }
    });

    if (error || !data?.properties?.action_link) {
      return redirectToQuickLogin(request, "link_failed", email);
    }

    return NextResponse.redirect(data.properties.action_link);
  } catch {
    return redirectToQuickLogin(request, "server_error", email);
  }
}

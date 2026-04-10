import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

import { isDevAnyEmailDomainEnabled, isDevQuickLoginEnabled } from "@/lib/dev-preview";

function getAdminEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return { url, anonKey, serviceRoleKey };
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
    password: "testpassword123",
    email_confirm: true,
    user_metadata: {
      first_name: email === "test1@butler.edu" ? "Alex" : email === "test2@butler.edu" ? "Jordan" : "Sam",
      last_initial: email === "test1@butler.edu" ? "R" : email === "test2@butler.edu" ? "M" : "T"
    }
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
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not found", { status: 404 });
  }

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
    const { url, anonKey, serviceRoleKey } = getAdminEnv();
    const adminClient = createSupabaseAdminClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    await ensureUserExists(adminClient, email);

    let response = NextResponse.redirect(new URL(nextPath ?? "/market", request.url));
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          response = NextResponse.redirect(new URL(nextPath ?? "/market", request.url));
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        }
      }
    });

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: "testpassword123"
    });

    if (error) {
      return redirectToQuickLogin(request, "login_failed", email);
    }

    return response;
  } catch {
    return redirectToQuickLogin(request, "server_error", email);
  }
}

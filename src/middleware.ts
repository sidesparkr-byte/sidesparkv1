import { NextResponse, type NextRequest } from "next/server";

import { isDevAnyEmailDomainEnabled, isDevPreviewEnabled } from "@/lib/dev-preview";
import { updateSession } from "@/lib/supabase/middleware";

const MAIN_ROUTE_PREFIXES = ["/feed", "/market", "/messages", "/profile", "/scan", "/rate"];
const AUTH_REQUIRED_EXTRA = ["/onboarding"];
const PUBLIC_PATHS = ["/login", "/signup", "/callback", "/reset-password", "/terms", "/api/health"];
const BUTLER_DOMAIN = "@butler.edu";
const isDevelopment = process.env.NODE_ENV === "development";

function isProtectedPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) {
    return false;
  }

  return (
    MAIN_ROUTE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    ) ||
    AUTH_REQUIRED_EXTRA.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  );
}

function shouldSkipProfileCompletionCheck(pathname: string) {
  return (
    pathname === "/onboarding" ||
    pathname.startsWith("/onboarding/") ||
    pathname === "/login" ||
    pathname === "/callback" ||
    pathname === "/terms" ||
    pathname === "/reset-password" ||
    pathname.startsWith("/api/")
  );
}

function isMainRoutePath(pathname: string) {
  return (
    pathname === "/" ||
    MAIN_ROUTE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  );
}

function isButlerEmail(email?: string | null) {
  return typeof email === "string" && email.toLowerCase().endsWith(BUTLER_DOMAIN);
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!isDevelopment && (pathname === "/dev/quick-login" || pathname.startsWith("/dev/quick-login/"))) {
    return new NextResponse("Not Found", { status: 404 });
  }

  if (isDevPreviewEnabled()) {
    return NextResponse.next();
  }

  const { response, supabase, user } = await updateSession(request);
  const userEmail = user?.email ?? null;

  if (user && !isDevAnyEmailDomainEnabled() && !isButlerEmail(userEmail)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("error", "domain");
    return NextResponse.redirect(loginUrl);
  }

  if (!user && isProtectedPath(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    const nextPath = `${pathname}${request.nextUrl.search || ""}`;
    loginUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isMainRoutePath(pathname) && !shouldSkipProfileCompletionCheck(pathname)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name,terms_accepted_at")
      .eq("id", user.id)
      .single();

    if (!profile?.first_name || !profile?.terms_accepted_at) {
      const onboardingUrl = request.nextUrl.clone();
      onboardingUrl.pathname = "/onboarding";
      onboardingUrl.search = "";
      return NextResponse.redirect(onboardingUrl);
    }
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    const feedUrl = request.nextUrl.clone();
    feedUrl.pathname = "/feed";
    feedUrl.search = "";
    return NextResponse.redirect(feedUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
};

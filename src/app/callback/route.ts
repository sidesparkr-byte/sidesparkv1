import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const errorDescription = searchParams.get("error_description");
  const supabase = createClient();

  if (errorDescription) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "auth_callback");
    return NextResponse.redirect(loginUrl);
  }

  if (type === "recovery" && code) {
    const { error: authError } = await supabase.auth.exchangeCodeForSession(code);

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

    return NextResponse.redirect(new URL("/reset-password", request.url));
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name,terms_accepted_at")
      .eq("id", user.id)
      .single();

    if (!profile?.first_name || !profile?.terms_accepted_at) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  return NextResponse.redirect(new URL("/", request.url));
}

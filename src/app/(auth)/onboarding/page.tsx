import { redirect } from "next/navigation";

import { OnboardingForm } from "@/app/(auth)/onboarding/onboarding-form";
import { createClient } from "@/lib/supabase/server";

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

export default async function OnboardingPage({
  searchParams
}: {
  searchParams?: { next?: string };
}) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name,last_initial,graduation_year,bio,major,photo_url")
    .eq("id", user.id)
    .maybeSingle();

  const nextPath = normalizeNextPath(searchParams?.next ?? null);

  return (
    <div className="mx-auto w-full max-w-sm space-y-4 pt-2">
      <OnboardingForm
        userId={user.id}
        email={user.email}
        defaults={profile}
        nextPath={nextPath}
      />
    </div>
  );
}

import { NextResponse } from "next/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

type FeedbackBody = {
  message?: string;
  page?: string;
};

function getAdminEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  return { url, serviceRoleKey };
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Please log in to share feedback." }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as FeedbackBody;
    const message = body.message?.trim();
    const page = body.page?.trim() || "/";

    if (!message) {
      return NextResponse.json({ error: "Feedback message is required." }, { status: 400 });
    }

    const { url, serviceRoleKey } = getAdminEnv();
    const adminClient = createSupabaseAdminClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    const { error } = await adminClient.from("feedback").insert({
      id: crypto.randomUUID(),
      user_id: user.id,
      message,
      page,
      created_at: new Date().toISOString()
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to submit feedback."
      },
      { status: 500 }
    );
  }
}

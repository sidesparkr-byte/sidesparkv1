import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { ServiceSellForm } from "@/app/(main)/market/sell/service/service-sell-form";

export default async function SellServicePage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <ServiceSellForm userId={user.id} />;
}


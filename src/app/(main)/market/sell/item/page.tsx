import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { ItemSellForm } from "@/app/(main)/market/sell/item/item-sell-form";

export default async function SellItemPage({
  searchParams
}: {
  searchParams?: { category?: string };
}) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const initialCategory = searchParams?.category === "books" ? "Books" : "Items";
  const initialCategoryGroup = searchParams?.category === "furniture" ? "furniture" : searchParams?.category === "books" ? "books" : "items";

  return (
    <ItemSellForm
      userId={user.id}
      initialCategory={initialCategory}
      initialCategoryGroup={initialCategoryGroup}
    />
  );
}

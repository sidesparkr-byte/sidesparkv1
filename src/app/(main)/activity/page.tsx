import { redirect } from "next/navigation";

export default function ActivityRedirectPage() {
  redirect("/profile?tab=activity");
}

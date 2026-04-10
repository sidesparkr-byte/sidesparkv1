export type NavItem = {
  href: string;
  label: string;
  icon: "home" | "market" | "post" | "messages" | "profile";
};

export const bottomNavItems: NavItem[] = [
  { href: "/feed", label: "Feed", icon: "home" },
  { href: "/market", label: "Market", icon: "market" },
  { href: "/market/sell", label: "Post", icon: "post" },
  { href: "/messages", label: "Messages", icon: "messages" },
  { href: "/profile", label: "Profile", icon: "profile" }
];

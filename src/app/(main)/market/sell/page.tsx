import Link from "next/link";
import { BookOpen, Home, ShoppingBag, Sparkles } from "lucide-react";

import { Card } from "@/components/ui";

const SELL_OPTIONS = [
  {
    href: "/market/sell/item?category=items",
    title: "Items",
    subtitle: "Clothing, shoes and more.",
    icon: "bag",
    iconBg: "#EEF2FF",
    iconColor: "#0039A6"
  },
  {
    href: "/market/sell/item?category=books",
    title: "Books",
    subtitle: "Textbooks and reading material.",
    icon: "book",
    iconBg: "#EEFAF4",
    iconColor: "#2D9B6F"
  },
  {
    href: "/market/sell/item?category=furniture",
    title: "Furniture",
    subtitle: "Dorm and house essentials.",
    icon: "home",
    iconBg: "#FFF4EF",
    iconColor: "#FF6B35"
  },
  {
    href: "/market/sell/service",
    title: "Services",
    subtitle: "Photography, DJing, moving help, cleaning, and more.",
    icon: "spark",
    iconBg: "#FEF9EE",
    iconColor: "#F59E0B"
  }
] as const;

function OptionIcon({ icon }: { icon: (typeof SELL_OPTIONS)[number]["icon"] }) {
  switch (icon) {
    case "bag":
      return <ShoppingBag className="h-5 w-5" strokeWidth={1.7} />;
    case "spark":
      return <Sparkles className="h-5 w-5" strokeWidth={1.7} />;
    case "book":
      return <BookOpen className="h-5 w-5" strokeWidth={1.7} />;
    case "home":
      return <Home className="h-5 w-5" strokeWidth={1.7} />;
  }
}

export default function SellEntryPage() {
  return (
    <div className="space-y-4 pb-2">
      <section className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
          What are you listing?
        </h1>
        <p className="max-w-[34ch] text-sm leading-6 text-[var(--color-text-secondary)]">
          Choose what you&apos;re listing to get started.
        </p>
      </section>

      <div className="grid gap-3">
        {SELL_OPTIONS.map((option) => (
          <Link key={option.href} href={option.href} className="block">
            <Card className="rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: option.iconBg,
                    color: option.iconColor
                  }}
                >
                  <OptionIcon icon={option.icon} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">{option.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">{option.subtitle}</p>
                </div>
                <span className="text-[var(--color-text-muted)]" aria-hidden="true">›</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

import Link from "next/link";

import { Card } from "@/components/ui";

const SELL_OPTIONS = [
  {
    href: "/market/sell/item?category=items",
    title: "Items",
    subtitle: "Furniture, clothing, electronics, decor, and misc.",
    icon: "bag"
  },
  {
    href: "/market/sell/item?category=books",
    title: "Books",
    subtitle: "Textbooks and reading material.",
    icon: "book"
  },
  {
    href: "/market/sell/service",
    title: "Services",
    subtitle: "Photography, DJing, moving help, cleaning, and more.",
    icon: "spark"
  }
] as const;

function OptionIcon({ icon }: { icon: (typeof SELL_OPTIONS)[number]["icon"] }) {
  switch (icon) {
    case "bag":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M4 8.5h16l-1.6 9.1A2 2 0 0 1 16.4 19H7.6a2 2 0 0 1-2-1.4L4 8.5Z" />
          <path d="M8.5 8.5V7a3.5 3.5 0 0 1 7 0v1.5" strokeLinecap="round" />
        </svg>
      );
    case "spark":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18.5l-1.8-5.9L4.5 10.8 10.2 9 12 3.5Z" strokeLinejoin="round" />
        </svg>
      );
    case "book":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M6.5 5.5h10A1.5 1.5 0 0 1 18 7v11.5H7.5A2.5 2.5 0 0 0 5 21V7a1.5 1.5 0 0 1 1.5-1.5Z" />
          <path d="M7.5 18.5A2.5 2.5 0 0 0 5 21h12.5" strokeLinecap="round" />
        </svg>
      );
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
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color:rgba(0,57,166,0.10)] text-[var(--color-primary)]">
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

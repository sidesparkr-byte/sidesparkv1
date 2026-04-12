export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatListingTitle(title: string): string {
  if (!title) return "";
  return title.charAt(0).toUpperCase() + title.slice(1);
}

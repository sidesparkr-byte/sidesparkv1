"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function ListingDetailTopBar({ title }: { title: string }) {
  const router = useRouter();

  return (
    <div className="sticky top-0 z-10 -mx-4 flex h-[52px] items-center border-b border-[#E5E5E5] bg-white px-4">
      <button
        type="button"
        aria-label="Go back"
        onClick={() => router.back()}
        className="flex h-11 w-11 shrink-0 items-center justify-center text-[#1A1A1A] transition active:scale-95"
      >
        <ChevronLeft aria-hidden="true" className="h-[22px] w-[22px]" strokeWidth={2.25} />
      </button>

      <p className="min-w-0 flex-1 truncate px-2 text-center text-[15px] font-semibold text-[#1A1A1A]">
        {title}
      </p>

      <div aria-hidden="true" className="h-11 w-11 shrink-0" />
    </div>
  );
}

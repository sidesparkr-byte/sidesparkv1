"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, ShoppingBag, Sparkles } from "lucide-react";

type PhotoCarouselProps = {
  photos: string[];
  title: string;
  categoryLabel: string;
};

function CategoryIcon({ categoryLabel }: { categoryLabel: string }) {
  if (categoryLabel === "Books") {
    return <BookOpen aria-hidden="true" className="h-12 w-12" strokeWidth={1.8} />;
  }
  if (categoryLabel === "Services") {
    return <Sparkles aria-hidden="true" className="h-12 w-12" strokeWidth={1.8} />;
  }
  return <ShoppingBag aria-hidden="true" className="h-12 w-12" strokeWidth={1.8} />;
}

function PlaceholderPhoto({
  categoryLabel,
  hidden = false
}: {
  categoryLabel: string;
  hidden?: boolean;
}) {
  return (
    <div
      className={`${hidden ? "hidden " : ""}flex aspect-[4/3] w-full items-center justify-center bg-[linear-gradient(135deg,#EEF2FF_0%,#E8F4FD_100%)] text-[#0039A6]`}
    >
      <div className="flex flex-col items-center justify-center">
        <CategoryIcon categoryLabel={categoryLabel} />
        <p className="mt-2 text-[14px] font-medium text-[#0039A6]">{categoryLabel}</p>
      </div>
    </div>
  );
}

export function PhotoCarousel({ photos, title, categoryLabel }: PhotoCarouselProps) {
  const safePhotos = photos.filter((photo) => typeof photo === "string" && photo.trim());
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = trackRef.current;
    if (!node || safePhotos.length <= 1) {
      return;
    }

    const onScroll = () => {
      const width = node.clientWidth || 1;
      const nextIndex = Math.round(node.scrollLeft / width);
      setActiveIndex(Math.max(0, Math.min(safePhotos.length - 1, nextIndex)));
    };

    node.addEventListener("scroll", onScroll, { passive: true });
    return () => node.removeEventListener("scroll", onScroll);
  }, [safePhotos.length]);

  if (safePhotos.length === 0) {
    return <PlaceholderPhoto categoryLabel={categoryLabel} />;
  }

  if (safePhotos.length === 1) {
    return (
      <div className="aspect-[4/3] overflow-hidden bg-[var(--color-surface)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={safePhotos[0]}
          alt={title}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            e.currentTarget.nextElementSibling?.classList.remove("hidden");
          }}
        />
        <PlaceholderPhoto categoryLabel={categoryLabel} hidden />
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="app-scroll flex snap-x snap-mandatory overflow-x-auto"
        aria-label="Listing photos"
      >
        {safePhotos.map((photo, index) => (
          <div key={`${photo}-${index}`} className="w-full shrink-0 snap-center">
            <div className="aspect-[4/3] overflow-hidden bg-[var(--color-surface)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo}
                alt={`${title} photo ${index + 1}`}
                className="h-full w-full object-cover"
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling?.classList.remove("hidden");
                }}
              />
              <PlaceholderPhoto categoryLabel={categoryLabel} hidden />
            </div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-3 left-1/2 flex max-w-[calc(100%-24px)] -translate-x-1/2 items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 backdrop-blur">
        {safePhotos.map((_, index) => (
          <span
            key={index}
            className={
              index === activeIndex
                ? "h-1.5 w-3 rounded-full bg-white"
                : "h-1.5 w-1.5 rounded-full bg-white/70"
            }
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}

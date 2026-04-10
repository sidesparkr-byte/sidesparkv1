"use client";

import { useEffect, useRef, useState } from "react";

type PhotoCarouselProps = {
  photos: string[];
  title: string;
};

function PlaceholderPhoto() {
  return (
    <div className="flex aspect-[4/3] w-full items-center justify-center bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-2)] text-[var(--color-text-muted)]">
      <svg
        viewBox="0 0 24 24"
        className="h-10 w-10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden="true"
      >
        <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z" />
        <path d="m6.5 15 3-3 2.5 2.5 3.5-4 2 2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="9" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    </div>
  );
}

export function PhotoCarousel({ photos, title }: PhotoCarouselProps) {
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
    return <PlaceholderPhoto />;
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
        />
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
              />
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

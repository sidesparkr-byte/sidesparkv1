"use client";

import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

export type AvatarSize = "sm" | "md" | "lg";

export type AvatarProps = {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  className?: string;
  imgClassName?: string;
};

const sizeClasses: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base"
};

function getInitials(name?: string) {
  if (!name) {
    return "?";
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({
  src,
  alt,
  name,
  size = "md",
  className,
  imgClassName
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const initials = useMemo(() => getInitials(name), [name]);
  const showImage = Boolean(src) && !imgError;

  useEffect(() => {
    setImgError(false);
  }, [src]);

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-surface)] font-semibold text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]",
        sizeClasses[size],
        className
      )}
      aria-label={alt ?? name ?? "Avatar"}
      title={name}
    >
      {showImage ? (
        <img
          src={src ?? undefined}
          alt={alt ?? name ?? "Avatar"}
          className={cn("h-full w-full object-cover", imgClassName)}
          loading="lazy"
          decoding="async"
          onError={() => setImgError(true)}
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </div>
  );
}

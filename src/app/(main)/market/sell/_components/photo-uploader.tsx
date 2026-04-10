"use client";

import { useRef } from "react";

import { Badge, Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";

export type PhotoDraft = {
  id: string;
  file: File;
  previewUrl: string;
};

type PhotoUploaderProps = {
  photos: PhotoDraft[];
  onChange: (next: PhotoDraft[]) => void;
  maxPhotos: number;
  label: string;
  helperText?: string;
};

function createPhotoId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function PhotoUploader({
  photos,
  onChange,
  maxPhotos,
  label,
  helperText
}: PhotoUploaderProps) {
  const draggingIdRef = useRef<string | null>(null);

  function updateFiles(fileList: FileList | null) {
    if (!fileList) {
      return;
    }

    const remaining = Math.max(0, maxPhotos - photos.length);
    const incoming = Array.from(fileList)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, remaining)
      .map((file) => ({
        id: createPhotoId(),
        file,
        previewUrl: URL.createObjectURL(file)
      }));

    if (incoming.length > 0) {
      onChange([...photos, ...incoming]);
    }
  }

  function removePhoto(id: string) {
    const next = photos.filter((photo) => photo.id !== id);
    const removed = photos.find((photo) => photo.id === id);
    if (removed) {
      URL.revokeObjectURL(removed.previewUrl);
    }
    onChange(next);
  }

  function movePhoto(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) {
      return;
    }

    const next = [...photos];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-medium text-neutral-700">{label}</p>
        {helperText ? <p className="text-xs text-neutral-500">{helperText}</p> : null}
      </div>

      <Card className="rounded-2xl border border-dashed border-neutral-300 p-3">
        <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-xl bg-neutral-50 text-center">
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(event) => {
              updateFiles(event.target.files);
              event.currentTarget.value = "";
            }}
          />
          <span className="text-sm font-medium text-neutral-700">
            Add photos ({photos.length}/{maxPhotos})
          </span>
          <span className="mt-1 text-xs text-neutral-500">
            Tap to open your camera/library. Drag tiles to reorder.
          </span>
        </label>
      </Card>

      {photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              draggable
              onDragStart={() => {
                draggingIdRef.current = photo.id;
              }}
              onDragOver={(event) => {
                event.preventDefault();
              }}
              onDrop={(event) => {
                event.preventDefault();
                const draggingId = draggingIdRef.current;
                if (!draggingId || draggingId === photo.id) {
                  return;
                }
                const fromIndex = photos.findIndex((item) => item.id === draggingId);
                const toIndex = photos.findIndex((item) => item.id === photo.id);
                movePhoto(fromIndex, toIndex);
                draggingIdRef.current = null;
              }}
              className="relative"
            >
              <div
                className={cn(
                  "aspect-[4/3] overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100",
                  index === 0 && "ring-2 ring-indigo-300"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.previewUrl}
                  alt={`Selected photo ${index + 1}`}
                  className="h-full w-full object-cover"
                  decoding="async"
                />
              </div>

              <div className="absolute left-1 top-1">
                {index === 0 ? (
                  <Badge variant="info" className="bg-white/95 text-[10px]">
                    Cover
                  </Badge>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => removePhoto(photo.id)}
                className="absolute right-1 top-1 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur"
                aria-label={`Remove photo ${index + 1}`}
              >
                <svg
                  viewBox="0 0 20 20"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path d="m6 6 8 8m0-8-8 8" strokeLinecap="round" />
                </svg>
              </button>

              <div className="mt-1 flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-11 flex-1 px-2 py-1 text-xs"
                  fullWidthMobile={false}
                  disabled={index === 0}
                  onClick={() => movePhoto(index, index - 1)}
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-11 flex-1 px-2 py-1 text-xs"
                  fullWidthMobile={false}
                  disabled={index === photos.length - 1}
                  onClick={() => movePhoto(index, index + 1)}
                >
                  ↓
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

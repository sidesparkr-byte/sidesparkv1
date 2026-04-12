"use client";

import { useRef } from "react";
import { Camera, Plus, X } from "lucide-react";

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
  const inputRef = useRef<HTMLInputElement | null>(null);

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

  const displaySlots = Array.from({ length: Math.min(maxPhotos, 3) }, (_, index) => photos[index] ?? null);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-medium text-neutral-700">{label}</p>
        {helperText ? <p className="text-xs text-neutral-500">{helperText}</p> : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="sr-only"
        onChange={(event) => {
          updateFiles(event.target.files);
          event.currentTarget.value = "";
        }}
      />

      <div className="flex w-full gap-2">
        <PhotoSlot
          photo={displaySlots[0]}
          index={0}
          isCover
          onOpenPicker={() => inputRef.current?.click()}
          onRemove={removePhoto}
        />
        <div className="flex w-[43%] shrink-0 flex-col gap-2">
          {displaySlots.slice(1).map((photo, slotIndex) => (
            <PhotoSlot
              key={slotIndex + 1}
              photo={photo}
              index={slotIndex + 1}
              onOpenPicker={() => inputRef.current?.click()}
              onRemove={removePhoto}
            />
          ))}
        </div>
      </div>

      <p className="mt-2 text-center text-[11px] text-[#9A9A9A]">
        First photo is your cover image
      </p>
    </div>
  );
}

function PhotoSlot({
  photo,
  index,
  isCover = false,
  onOpenPicker,
  onRemove
}: {
  photo: PhotoDraft | null;
  index: number;
  isCover?: boolean;
  onOpenPicker: () => void;
  onRemove: (id: string) => void;
}) {
  const slotClasses = isCover
    ? "aspect-square w-[55%] rounded-xl"
    : "min-h-0 flex-1 rounded-[10px]";

  return (
    <div className={`relative overflow-hidden bg-[#F5F5F5] ${slotClasses}`}>
      <button
        type="button"
        onClick={onOpenPicker}
        className={`flex h-full w-full items-center justify-center overflow-hidden ${
          photo ? "" : "border-2 border-dashed border-[#E5E5E5]"
        } ${isCover ? "rounded-xl" : "rounded-[10px]"}`}
        aria-label={photo ? `Replace photo ${index + 1}` : `Add photo ${index + 1}`}
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo.previewUrl}
            alt={`Selected photo ${index + 1}`}
            className="h-full w-full object-cover"
            decoding="async"
          />
        ) : isCover ? (
          <span className="flex flex-col items-center justify-center text-[#9A9A9A]">
            <Camera className="h-7 w-7" aria-hidden="true" strokeWidth={1.8} />
            <span className="mt-1.5 text-[11px]">Cover photo</span>
          </span>
        ) : (
          <Plus className="h-5 w-5 text-[#C5C5C5]" aria-hidden="true" strokeWidth={2} />
        )}
      </button>

      {photo ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRemove(photo.id);
          }}
          className="absolute right-1.5 top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white text-[#1A1A1A] shadow-[0_2px_8px_rgba(0,0,0,0.16)]"
          aria-label={`Remove photo ${index + 1}`}
        >
          <X className="h-3 w-3" aria-hidden="true" strokeWidth={2.2} />
        </button>
      ) : null}
    </div>
  );
}

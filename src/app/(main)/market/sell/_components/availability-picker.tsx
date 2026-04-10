"use client";

import { cn } from "@/lib/utils";

export type AvailabilityValue = {
  days: string[];
  windows: string[];
};

type AvailabilityPickerProps = {
  value: AvailabilityValue;
  onChange: (value: AvailabilityValue) => void;
  className?: string;
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const WINDOWS = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" }
] as const;

function toggleValue(current: string[], next: string) {
  return current.includes(next)
    ? current.filter((value) => value !== next)
    : [...current, next];
}

export function AvailabilityPicker({
  value,
  onChange,
  className
}: AvailabilityPickerProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <p className="text-sm font-medium text-neutral-700">Days available</p>
        <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">
          {DAYS.map((day) => {
            const active = value.days.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    days: toggleValue(value.days, day)
                  })
                }
                className={cn(
                  "min-h-11 rounded-xl border text-xs font-medium transition",
                  active
                    ? "border-indigo-200 bg-indigo-100 text-indigo-700"
                    : "border-neutral-200 bg-white text-neutral-600"
                )}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-neutral-700">Time windows</p>
        <div className="mt-2 flex gap-2">
          {WINDOWS.map((windowOption) => {
            const active = value.windows.includes(windowOption.value);
            return (
              <button
                key={windowOption.value}
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    windows: toggleValue(value.windows, windowOption.value)
                  })
                }
                className={cn(
                  "min-h-11 flex-1 rounded-xl border px-3 text-sm font-medium transition",
                  active
                    ? "border-indigo-200 bg-indigo-100 text-indigo-700"
                    : "border-neutral-200 bg-white text-neutral-600"
                )}
              >
                {windowOption.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}


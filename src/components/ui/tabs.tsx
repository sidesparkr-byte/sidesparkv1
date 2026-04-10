"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export type TabsItem = {
  value: string;
  label: React.ReactNode;
};

export type TabsProps = {
  tabs: TabsItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  tabClassName?: string;
};

export function Tabs({
  tabs,
  value,
  defaultValue,
  onValueChange,
  className,
  tabClassName
}: TabsProps) {
  const firstValue = tabs[0]?.value ?? "";
  const [internalValue, setInternalValue] = useState(defaultValue ?? firstValue);
  const currentValue = value ?? internalValue;

  useEffect(() => {
    if (!value && !internalValue && firstValue) {
      setInternalValue(firstValue);
    }
  }, [firstValue, internalValue, value]);

  return (
    <div className={cn("border-b border-[var(--color-border)]", className)}>
      <div className="app-scroll -mb-px flex gap-2 overflow-x-auto px-1">
        {tabs.map((tab) => {
          const active = currentValue === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              className={cn(
                "relative min-h-11 shrink-0 whitespace-nowrap px-3 text-sm font-medium transition",
                active
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
                tabClassName
              )}
              onClick={() => {
                if (value === undefined) {
                  setInternalValue(tab.value);
                }
                onValueChange?.(tab.value);
              }}
              aria-pressed={active}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "absolute inset-x-2 bottom-0 h-0.5 rounded-full transition",
                  active ? "bg-[var(--color-primary)]" : "bg-transparent"
                )}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

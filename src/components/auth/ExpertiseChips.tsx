"use client";

import { useMemo, useState } from "react";

const TAG_OPTIONS = [
  "Ancient Coins",
  "British India",
  "Gold Coins",
  "Silver Coins",
  "Mughal Empire",
  "Medieval Coins",
  "Indian Princely Coins",
  "Colonial Era",
  "World Coins",
  "Modern Indian Coins",
  "Others",
] as const;

const DEFAULT_SELECTED = new Set<string>([
  "Ancient Coins",
  "British India",
  "Gold Coins",
  "Silver Coins",
  "Mughal Empire",
]);

type ExpertiseChipsProps = {
  /** Form field name for the comma-separated list of selected tags. */
  name?: string;
  className?: string;
};

const chipBase =
  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2";

export function ExpertiseChips({
  name = "expertise",
  className = "",
}: ExpertiseChipsProps) {
  const [selected, setSelected] = useState<Set<string>>(DEFAULT_SELECTED);

  const value = useMemo(() => [...selected].join(","), [selected]);

  function toggle(tag: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  }

  return (
    <div className={className}>
      <input type="hidden" name={name} value={value} />
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Expertise categories"
      >
        {TAG_OPTIONS.map((tag) => {
          const isOn = selected.has(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              aria-pressed={isOn}
              className={
                isOn
                  ? `${chipBase} bg-primary text-white hover:bg-primary-hover`
                  : `${chipBase} border border-border bg-input-bg font-medium text-text-muted hover:border-text-muted/60 hover:text-text`
              }
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}

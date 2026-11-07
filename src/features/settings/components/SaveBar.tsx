"use client";

import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import type { SettingsFormValues } from "../types";

const GROUP_LABELS: Record<string, string> = {
  name: "name",
  email: "email",
  currencyCode: "currency",
  customSymbol: "currency",
  themeAccent: "theme",
  themeBase: "theme",
  themeMode: "theme",
};

function changedGroups(dirty: Partial<Record<keyof SettingsFormValues, boolean>>): string[] {
  const labels = new Set<string>();
  for (const key of Object.keys(dirty)) {
    const label = GROUP_LABELS[key];
    if (label) labels.add(label);
  }
  return [...labels];
}

export function SaveBar({ pending, onDiscard }: { pending: boolean; onDiscard: () => void }) {
  const {
    formState: { isDirty, dirtyFields },
  } = useFormContext<SettingsFormValues>();

  if (!isDirty) return null;

  const groups = changedGroups(dirtyFields);
  const label =
    groups.length === 1
      ? `Unsaved ${groups[0]} change`
      : `Unsaved ${groups.join(", ")} changes`;

  return (
    <div className="sticky bottom-0 z-10 -mx-4 -mb-5 border-t border-line bg-panel/95 px-4 py-3 backdrop-blur sm:-mx-7 sm:-mb-7 sm:px-7">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-sm text-muted">{label}</p>
        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="ghost" onClick={onDiscard} disabled={pending}>
            Discard
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

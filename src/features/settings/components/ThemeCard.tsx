"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { SettingsFormValues } from "../types";

const ACCENT_PRESETS = [
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#16a34a",
  "#0d9488",
  "#7a8b3c",
  "#e11d48",
];

const BASES = [
  { value: "cool", label: "Cool" },
  { value: "neutral", label: "Neutral" },
  { value: "contrast", label: "Contrast" },
] as const;

const MODES = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

export function ThemeCard() {
  const {
    control,
    watch,
    formState: { errors },
  } = useFormContext<SettingsFormValues>();
  const accent = watch("themeAccent");
  const safeAccent = HEX_PATTERN.test(accent) ? accent : "#000000";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme</CardTitle>
        <CardDescription>Accent color, base tone, and light or dark mode.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 pb-6">
        <Controller
          control={control}
          name="themeAccent"
          render={({ field }) => (
            <div className="grid gap-2">
              <Label>Accent</Label>
              <div role="radiogroup" aria-label="Accent color" className="flex flex-wrap gap-2">
                {ACCENT_PRESETS.map((hex) => {
                  const active = field.value.toLowerCase() === hex;
                  return (
                    <button
                      key={hex}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      aria-label={hex}
                      onClick={() => field.onChange(hex)}
                      className={cn(
                        "size-8 rounded-full border-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
                        active ? "border-foreground" : "border-transparent",
                      )}
                      style={{ backgroundColor: hex }}
                    />
                  );
                })}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={safeAccent}
                  onChange={(event) => field.onChange(event.target.value)}
                  aria-label="Custom accent"
                  className="h-10 w-12 cursor-pointer rounded-lg border border-line bg-surface p-1"
                />
                <Input
                  value={field.value}
                  onChange={(event) => field.onChange(event.target.value)}
                  onBlur={field.onBlur}
                  name={field.name}
                  maxLength={7}
                  placeholder="#2563eb"
                  aria-label="Accent hex"
                  className="font-mono"
                />
              </div>
              {errors.themeAccent ? (
                <p className="text-sm text-negative">{errors.themeAccent.message}</p>
              ) : null}
            </div>
          )}
        />

        <Controller
          control={control}
          name="themeBase"
          render={({ field }) => (
            <div className="grid gap-2">
              <Label>Base</Label>
              <div role="radiogroup" aria-label="Base tone" className="grid grid-cols-3 gap-2">
                {BASES.map((base) => (
                  <button
                    key={base.value}
                    type="button"
                    role="radio"
                    aria-checked={field.value === base.value}
                    onClick={() => field.onChange(base.value)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent",
                      field.value === base.value
                        ? "border-accent bg-accent-soft"
                        : "border-line bg-surface hover:bg-surface/70",
                    )}
                  >
                    {base.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        />

        <Controller
          control={control}
          name="themeMode"
          render={({ field }) => (
            <div className="grid gap-2">
              <Label>Mode</Label>
              <div role="radiogroup" aria-label="Theme mode" className="grid grid-cols-3 gap-2">
                {MODES.map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    role="radio"
                    aria-checked={field.value === mode.value}
                    onClick={() => field.onChange(mode.value)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent",
                      field.value === mode.value
                        ? "border-accent bg-accent-soft"
                        : "border-line bg-surface hover:bg-surface/70",
                    )}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        />
      </CardContent>
    </Card>
  );
}

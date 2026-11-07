"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SettingsFormValues } from "../types";

function initials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

export function ProfileCard() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<SettingsFormValues>();
  const name = watch("name") ?? "";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <span
            aria-hidden="true"
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-base font-semibold text-accent-ink"
          >
            {initials(name)}
          </span>
          <div>
            <CardTitle>Profile</CardTitle>
            <CardDescription>The name and initials shown on your avatar.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 pb-6">
        <div className="grid gap-2">
          <Label htmlFor="name">Display name</Label>
          <Input id="name" maxLength={40} placeholder="Your name" {...register("name")} />
          {errors.name ? <p className="text-sm text-negative">{errors.name.message}</p> : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">
            Email <span className="text-muted">(optional)</span>
          </Label>
          <Input
            id="email"
            type="email"
            maxLength={80}
            placeholder="you@example.com"
            {...register("email")}
          />
          {errors.email ? <p className="text-sm text-negative">{errors.email.message}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { FormProvider, useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useDraft } from "@/hooks/use-draft";
import { accentCssVariables } from "@/lib/theme";
import { saveSettings } from "../actions";
import type { SettingsData } from "../queries";
import { settingsSchema } from "../schema";
import type { SettingsFormValues } from "../types";
import { CurrencyCard } from "./CurrencyCard";
import { DataCard } from "./DataCard";
import { ProfileCard } from "./ProfileCard";
import { SaveBar } from "./SaveBar";
import { SecurityCard } from "./SecurityCard";
import { ThemeCard } from "./ThemeCard";

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

export function SettingsForm({ settings }: { settings: SettingsData }) {
  const { resolvedTheme, setTheme } = useTheme();

  const methods = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema) as unknown as Resolver<SettingsFormValues>,
    mode: "onTouched",
    defaultValues: {
      name: settings.user.name ?? "",
      email: settings.user.email ?? "",
      currencyCode: settings.preferences.currencyCode,
      customSymbol: settings.preferences.customSymbol ?? "",
      themeAccent: settings.preferences.themeAccent,
      themeBase: settings.preferences.themeBase,
      themeMode: settings.preferences.themeMode,
    },
  });

  const { handleSubmit, reset, formState } = methods;
  const { isDirty, isSubmitting } = formState;

  const accent = useWatch({ control: methods.control, name: "themeAccent" });
  const base = useWatch({ control: methods.control, name: "themeBase" });
  const mode = useWatch({ control: methods.control, name: "themeMode" });

  const savedRef = useRef({
    accent: settings.preferences.themeAccent,
    base: settings.preferences.themeBase,
    mode: settings.preferences.themeMode,
  });

  useEffect(() => {
    savedRef.current = {
      accent: settings.preferences.themeAccent,
      base: settings.preferences.themeBase,
      mode: settings.preferences.themeMode,
    };
  }, [
    settings.preferences.themeAccent,
    settings.preferences.themeBase,
    settings.preferences.themeMode,
  ]);

  // R3 — live preview: repaint immediately, store nothing.
  useEffect(() => {
    if (!HEX_PATTERN.test(accent)) return;
    const resolved = resolvedTheme === "light" ? "light" : "dark";
    const vars = accentCssVariables(accent, resolved);
    const style = document.documentElement.style;
    for (const [key, value] of Object.entries(vars)) style.setProperty(key, value);
  }, [accent, resolvedTheme]);

  useEffect(() => {
    document.documentElement.dataset.base = base;
  }, [base]);

  useEffect(() => {
    setTheme(mode);
  }, [mode, setTheme]);

  // On unmount (navigate away, discard) restore the saved theme.
  useEffect(() => {
    return () => {
      const style = document.documentElement.style;
      for (const key of Object.keys(accentCssVariables(savedRef.current.accent, "dark"))) {
        style.removeProperty(key);
      }
      document.documentElement.dataset.base = savedRef.current.base;
      setTheme(savedRef.current.mode);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useDraft(isDirty);

  const onSubmit = handleSubmit(async (values) => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(values)) formData.append(key, value ?? "");
    const result = await saveSettings({ ok: true }, formData);
    if (result.ok) {
      const canonical = {
        ...values,
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        customSymbol: values.customSymbol.trim(),
        themeAccent: values.themeAccent.toLowerCase(),
      };
      reset(canonical);
      toast.success("Settings saved");
    } else {
      toast.error("message" in result && result.message ? result.message : "Could not save settings");
    }
  });

  function discard() {
    reset();
    toast.info("Changes discarded");
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} noValidate>
        <div className={`space-y-6 ${isDirty ? "pb-20" : ""}`}>
          <ProfileCard />
          <CurrencyCard />
          <ThemeCard />
          <SecurityCard enabled={settings.hasSecondFactor} />
          <DataCard />
        </div>
        <SaveBar pending={isSubmitting} onDiscard={discard} />
      </form>
    </FormProvider>
  );
}

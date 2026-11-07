import "server-only";
import { cache } from "react";
import type { CurrencyCode } from "@/lib/finance/currency";
import { DEFAULT_ACCENT, type ThemeBase, type ThemeMode } from "@/lib/theme";
import { getSession, requireUser } from "@/server/auth/session";
import { findPreference } from "@/server/repositories/preferences";
import { findUserById } from "@/server/repositories/users";
import { hasConfirmedSecondFactor } from "@/server/services/auth";

export interface SettingsPreferences {
  currencyCode: CurrencyCode;
  customSymbol: string | null;
  decimals: number;
  position: string;
  themeAccent: string;
  themeBase: ThemeBase;
  themeMode: ThemeMode;
}

export interface SettingsData {
  user: { name: string | null; email: string | null };
  preferences: SettingsPreferences;
  hasSecondFactor: boolean;
}

export const DEFAULT_PREFERENCES: SettingsPreferences = {
  currencyCode: "USD",
  customSymbol: null,
  decimals: 2,
  position: "prefix",
  themeAccent: DEFAULT_ACCENT,
  themeBase: "cool",
  themeMode: "system",
};

export const getSettings = cache(async (): Promise<SettingsData> => {
  const sessionUser = await requireUser();
  const [user, preference, hasSecondFactor] = await Promise.all([
    findUserById(sessionUser.id),
    findPreference(sessionUser.id),
    hasConfirmedSecondFactor(sessionUser.id),
  ]);

  return {
    user: {
      name: user?.name ?? null,
      email: user?.email ?? null,
    },
    preferences: preference
      ? {
          currencyCode: preference.currencyCode as CurrencyCode,
          customSymbol: preference.customSymbol,
          decimals: preference.decimals,
          position: preference.position,
          themeAccent: preference.themeAccent,
          themeBase: preference.themeBase as ThemeBase,
          themeMode: preference.themeMode as ThemeMode,
        }
      : DEFAULT_PREFERENCES,
    hasSecondFactor,
  };
});

/** Theme-only read for the root layout — no session, no redirect. */
export interface ThemePreferences {
  accent: string;
  base: ThemeBase;
  mode: ThemeMode;
}

export const getThemePreferences = cache(async (): Promise<ThemePreferences> => {
  const session = await getSession();
  if (!session?.user?.id) {
    return { accent: DEFAULT_ACCENT, base: "cool", mode: "system" };
  }
  const preference = await findPreference(session.user.id);
  return {
    accent: preference?.themeAccent ?? DEFAULT_ACCENT,
    base: (preference?.themeBase as ThemeBase) ?? "cool",
    mode: (preference?.themeMode as ThemeMode) ?? "system",
  };
});

/** Currency-only read for the app shell account menu. */
export const getCurrentCurrency = cache(async (): Promise<string> => {
  const session = await getSession();
  if (!session?.user?.id) return DEFAULT_PREFERENCES.currencyCode;
  const preference = await findPreference(session.user.id);
  return preference?.currencyCode ?? DEFAULT_PREFERENCES.currencyCode;
});

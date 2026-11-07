import "server-only";
import { currencyFormat } from "@/lib/finance/currency";
import { DEFAULT_ACCENT } from "@/lib/theme";
import { clearAllLedgerData } from "@/server/repositories/ledger";
import { findPreference, upsertPreference } from "@/server/repositories/preferences";
import { updateProfile } from "@/server/repositories/users";
import type { SettingsInput } from "@/features/settings/schema";

const DEFAULTS = {
  currencyCode: "USD",
  customSymbol: null as string | null,
  themeAccent: DEFAULT_ACCENT,
  themeBase: "cool",
  themeMode: "system",
};

export async function saveSettings(userId: string, input: SettingsInput) {
  const profile: { name?: string; email?: string } = {};
  const name = input.name?.trim();
  const email = input.email?.trim().toLowerCase();
  if (name) profile.name = name;
  if (email) profile.email = email;
  if (Object.keys(profile).length > 0) await updateProfile(userId, profile);

  const format = currencyFormat(input.currencyCode, null);
  await upsertPreference(userId, {
    currencyCode: input.currencyCode,
    customSymbol: input.customSymbol?.trim() || null,
    decimals: format.decimals,
    position: format.position,
    themeAccent: input.themeAccent.toLowerCase(),
    themeBase: input.themeBase,
    themeMode: input.themeMode,
  });
}

/** R8 — the account-menu quick switch is immediate and changes currency only. */
export async function setCurrency(userId: string, code: string) {
  const existing = await findPreference(userId);
  const format = currencyFormat(code, null);
  await upsertPreference(userId, {
    currencyCode: code,
    customSymbol: existing?.customSymbol ?? null,
    decimals: format.decimals,
    position: format.position,
    themeAccent: existing?.themeAccent ?? DEFAULTS.themeAccent,
    themeBase: existing?.themeBase ?? DEFAULTS.themeBase,
    themeMode: existing?.themeMode ?? DEFAULTS.themeMode,
  });
}

export async function clearAllData(userId: string) {
  await clearAllLedgerData(userId);
}

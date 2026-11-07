import { z } from "zod";

export const currencyCodes = ["USD", "KHR", "EUR", "GBP"] as const;

export const settingsSchema = z.object({
  name: z.string().trim().max(40).optional(),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .max(80)
    .or(z.literal("")),
  currencyCode: z.enum(currencyCodes),
  customSymbol: z.string().trim().max(4).optional(),
  themeAccent: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Enter a hex color"),
  themeBase: z.enum(["cool", "neutral", "contrast"]),
  themeMode: z.enum(["system", "light", "dark"]),
});

export type SettingsInput = z.infer<typeof settingsSchema>;

export const setCurrencySchema = z.object({
  code: z.enum(currencyCodes),
});

import type { CurrencyCode } from "@/lib/finance/currency";
import type { ThemeBase, ThemeMode } from "@/lib/theme";

export interface SettingsFormValues {
  name: string;
  email: string;
  currencyCode: CurrencyCode;
  customSymbol: string;
  themeAccent: string;
  themeBase: ThemeBase;
  themeMode: ThemeMode;
}

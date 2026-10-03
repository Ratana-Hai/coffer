export type CurrencyCode = "USD" | "KHR" | "EUR" | "GBP";
export type CurrencyPosition = "prefix" | "suffix";

export interface CurrencyFormat {
  code: CurrencyCode;
  symbol: string;
  decimals: number;
  position: CurrencyPosition;
}

const currencies: Record<CurrencyCode, Omit<CurrencyFormat, "code">> = {
  USD: { symbol: "$", decimals: 2, position: "prefix" },
  KHR: { symbol: "៛", decimals: 0, position: "suffix" },
  EUR: { symbol: "€", decimals: 2, position: "prefix" },
  GBP: { symbol: "£", decimals: 2, position: "prefix" },
};

export function currencyFormat(
  code: string | null | undefined,
  customSymbol: string | null = null,
  decimals?: number,
  position?: string,
): CurrencyFormat {
  const validCode = code && code in currencies ? (code as CurrencyCode) : "USD";
  const preset = currencies[validCode];
  return {
    code: validCode,
    symbol: customSymbol || preset.symbol,
    decimals:
      decimals !== undefined && Number.isInteger(decimals)
        ? Math.min(2, Math.max(0, decimals))
        : preset.decimals,
    position: position === "suffix" ? "suffix" : preset.position,
  };
}

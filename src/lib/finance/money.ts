import type { CurrencyFormat } from "./currency";

export type Minor = number;

export function decimalToMinor(value: string): Minor {
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(value.trim());
  if (!match) throw new Error(`Invalid decimal amount: ${value}`);

  const [, sign, whole, fraction = ""] = match;
  const fractionCents = fraction.padEnd(3, "0");
  let cents = Number(whole) * 100 + Number(fractionCents.slice(0, 2));
  if (fractionCents[2] >= "5") cents += 1;
  if (sign === "-") cents = -cents;
  if (!Number.isSafeInteger(cents)) {
    throw new RangeError("Amount exceeds the safe minor-unit range");
  }
  return cents;
}

export function fmtMoney(amount: Minor, currency: CurrencyFormat): string {
  const precision = Math.min(2, Math.max(0, currency.decimals));
  const scale = 10 ** (2 - precision);
  const displayScale = 10 ** precision;
  const rounded = Math.floor((Math.abs(amount) + scale / 2) / scale);
  const whole = Math.floor(rounded / displayScale).toLocaleString("en-US");
  const fraction = precision ? `.${String(rounded % displayScale).padStart(precision, "0")}` : "";
  const sign = amount < 0 ? "−" : "";
  const value = `${whole}${fraction}`;
  return currency.position === "suffix"
    ? `${sign}${value}${currency.symbol}`
    : `${sign}${currency.symbol}${value}`;
}

export function fmtCompact(amount: Minor, currency: CurrencyFormat): string {
  const precision = Math.min(2, Math.max(0, currency.decimals));
  const scale = 10 ** (2 - precision);
  const roundedMinor = Math.floor((Math.abs(amount) + scale / 2) / scale);
  const value = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumSignificantDigits: 3,
  }).format(roundedMinor / 10 ** precision);
  const sign = amount < 0 ? "−" : "";
  return currency.position === "suffix"
    ? `${sign}${value}${currency.symbol}`
    : `${sign}${currency.symbol}${value}`;
}

export function minorToMajor(amount: Minor): number {
  return amount / 100;
}

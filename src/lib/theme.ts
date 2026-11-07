// Accent theme derivation.
//
// The design token system takes one accent hex and derives the six tokens the
// UI consumes, plus the text colors that sit *on* the accent and the accent
// *as* text. Those two are chosen by measuring WCAG contrast ratio against the
// candidates — never by comparing luminance to a threshold. The threshold
// shortcut is what makes mid-tone accents (e.g. #7a8b3c) illegible, so it is
// deliberately not used here (spec 07, R11).

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface AccentTokens {
  accent: string;
  strong: string;
  deep: string;
  soft: string;
  line: string;
  ink: string;
  text: string;
}

export type ThemeMode = "system" | "light" | "dark";
export type ThemeBase = "cool" | "neutral" | "contrast";

export const DEFAULT_ACCENT = "#2563eb";
export const DARK_BACKGROUND = "#111512";
export const LIGHT_BACKGROUND = "#ffffff";

const INK_DARK: Rgb = { r: 10, g: 12, b: 16 };
const INK_LIGHT: Rgb = { r: 255, g: 255, b: 255 };

export function hexToRgb(hex: string): Rgb {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  if (normalized.length !== 6 || Number.isNaN(value)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: (value >> 16) & 0xff,
    g: (value >> 8) & 0xff,
    b: value & 0xff,
  };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const clamp = (n: number) => Math.round(Math.min(255, Math.max(0, n)));
  return `#${[r, g, b].map((n) => clamp(n).toString(16).padStart(2, "0")).join("")}`;
}

function channelToLinear(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(rgb: Rgb): number {
  return (
    0.2126 * channelToLinear(rgb.r) +
    0.7152 * channelToLinear(rgb.g) +
    0.0722 * channelToLinear(rgb.b)
  );
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const first = relativeLuminance(a);
  const second = relativeLuminance(b);
  const [light, dark] = first >= second ? [first, second] : [second, first];
  return (light + 0.05) / (dark + 0.05);
}

export function blend(foreground: Rgb, background: Rgb, weight: number): Rgb {
  const w = Math.min(1, Math.max(0, weight));
  return {
    r: foreground.r * w + background.r * (1 - w),
    g: foreground.g * w + background.g * (1 - w),
    b: foreground.b * w + background.b * (1 - w),
  };
}

export function rgba(rgb: Rgb, alpha: number): string {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/** Text placed on the accent: the candidate (near-black or white) with the
 * higher measured contrast against the accent wins. */
export function pickAccentInk(accent: Rgb): string {
  const dark = contrastRatio(accent, INK_DARK);
  const light = contrastRatio(accent, INK_LIGHT);
  return dark >= light ? rgbToHex(INK_DARK) : rgbToHex(INK_LIGHT);
}

/** Blend the accent toward white (on a dark background) or black (on a light
 * one) until it clears the target ratio, so the accent can be used as text. */
export function ensureContrast(foreground: Rgb, background: Rgb, target = 4.5): Rgb {
  if (contrastRatio(foreground, background) >= target) return foreground;
  const toward = relativeLuminance(background) < 0.5 ? INK_LIGHT : INK_DARK;
  let current = foreground;
  for (let step = 1; step <= 40; step += 1) {
    current = blend(toward, foreground, step / 40);
    if (contrastRatio(current, background) >= target) return current;
  }
  return toward;
}

export function deriveAccentTokens(accentHex: string, background: string): AccentTokens {
  const accent = hexToRgb(accentHex);
  const bg = hexToRgb(background);
  return {
    accent: accentHex.toLowerCase(),
    strong: rgbToHex(accent),
    deep: rgbToHex(blend(INK_DARK, accent, 0.4)),
    soft: rgba(accent, 0.14),
    line: rgba(accent, 0.3),
    ink: pickAccentInk(accent),
    text: rgbToHex(ensureContrast(accent, bg)),
  };
}

/** CSS custom properties for one mode, ready to spread onto an inline style or
 * emit into a <style> block. Pure — importable from client components too. */
export function accentCssVariables(
  accentHex: string,
  mode: "light" | "dark",
): Record<string, string> {
  const tokens = deriveAccentTokens(accentHex, mode === "dark" ? DARK_BACKGROUND : LIGHT_BACKGROUND);
  return {
    "--accent": tokens.accent,
    "--accent-strong": tokens.strong,
    "--accent-deep": tokens.deep,
    "--accent-soft": tokens.soft,
    "--accent-line": tokens.line,
    "--accent-ink": tokens.ink,
    "--accent-text": tokens.text,
  };
}

/** A <style> block that paints the dark defaults on :root and overrides the
 * mode-dependent tokens under .light. Soft/line/text adapt to the background;
 * accent/strong/deep/ink are identical in both modes. */
export function accentStyleSheet(accentHex: string): string {
  const dark = deriveAccentTokens(accentHex, DARK_BACKGROUND);
  const light = deriveAccentTokens(accentHex, LIGHT_BACKGROUND);
  const root = [
    `--accent:${dark.accent}`,
    `--accent-strong:${dark.strong}`,
    `--accent-deep:${dark.deep}`,
    `--accent-soft:${dark.soft}`,
    `--accent-line:${dark.line}`,
    `--accent-ink:${dark.ink}`,
    `--accent-text:${dark.text}`,
  ].join(";");
  const lightOverrides = [
    `--accent-soft:${light.soft}`,
    `--accent-line:${light.line}`,
    `--accent-text:${light.text}`,
  ].join(";");
  return `:root{${root}} .light{${lightOverrides}}`;
}

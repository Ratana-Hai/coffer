import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { getThemePreferences } from "@/features/settings/queries";
import { accentStyleSheet } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Coffer | Money, made legible",
  description: "A calmer personal finance workspace.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const theme = await getThemePreferences();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-base={theme.base}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <style dangerouslySetInnerHTML={{ __html: accentStyleSheet(theme.accent) }} />
        <Providers mode={theme.mode}>{children}</Providers>
      </body>
    </html>
  );
}

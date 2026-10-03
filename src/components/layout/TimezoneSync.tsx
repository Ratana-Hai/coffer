"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function TimezoneSync() {
  const router = useRouter();

  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const cookieValue = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("coffer-timezone="))
      ?.slice("coffer-timezone=".length);
    try {
      if (cookieValue && decodeURIComponent(cookieValue) === timeZone) return;
    } catch {
      // Replace a malformed client cookie with the browser's current zone.
    }

    document.cookie = `coffer-timezone=${encodeURIComponent(timeZone)}; Path=/; Max-Age=31536000; SameSite=Lax`;
    router.refresh();
  }, [router]);

  return null;
}

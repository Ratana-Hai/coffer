"use client";

import { useEffect } from "react";

/**
 * Draft navigation guard (spec 07, R3). Wires `beforeunload` (reload / leaving
 * the site) and a capture-phase click guard (in-app <a> navigation) to a
 * react-hook-form dirty flag. Leaving always reverts — nothing is persisted
 * until the form calls Save.
 */
export function useDraft(isDirty: boolean, message = "You have unsaved changes.") {
  useEffect(() => {
    if (!isDirty) return;

    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = message;
      return message;
    };
    window.addEventListener("beforeunload", beforeUnload);

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      const target = event.target as Element | null;
      const anchor = target?.closest?.("a");
      if (!anchor) return;
      if (anchor.hasAttribute("download") || anchor.target === "_blank") return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("//") || href.startsWith("#")) {
        return;
      }
      const next = new URL(href, window.location.href);
      if (next.origin !== window.location.origin) return;
      if (next.pathname === window.location.pathname && next.search === window.location.search) {
        return;
      }
      if (!window.confirm(message)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener("click", onClick, true);

    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [isDirty, message]);
}

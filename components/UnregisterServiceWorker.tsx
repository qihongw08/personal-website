"use client";

import { useEffect } from "react";

/**
 * Removes orphan service workers left on localhost (or anywhere) from prior
 * projects. Without this, soft reloads can hit a stale SW that intercepts
 * navigations and serves empty/404 responses.
 */
export function UnregisterServiceWorker() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator))
      return;
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => regs.forEach((r) => r.unregister()))
      .catch(() => {});
  }, []);
  return null;
}

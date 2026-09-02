"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Keeps an installed Dobby current.
 *
 * A standalone PWA has no address bar, no reload button and no pull-to-
 * refresh, so an installed copy can sit on a stale build forever. This
 * registers the service worker, quietly re-checks for a new one whenever the
 * app is brought back to the foreground, and — when one is waiting — offers a
 * single Update tap. The worker file is build-stamped, so the check actually
 * detects new deploys without needing a full relaunch.
 */
export function UpdatePrompt() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const regRef = useRef<ServiceWorkerRegistration | null>(null);
  const askedRef = useRef(false);
  const reloadingRef = useRef(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;

    // Only surface a worker that would replace one already running — a fresh
    // install has no controller yet and shouldn't nag on first load.
    const consider = (sw: ServiceWorker | null) => {
      if (!cancelled && sw && navigator.serviceWorker.controller) setWaiting(sw);
    };

    const track = (reg: ServiceWorkerRegistration) => {
      regRef.current = reg;
      consider(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener("statechange", () => {
          if (nw.state === "installed") consider(reg.waiting ?? nw);
        });
      });
    };

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        if (cancelled) return;
        track(reg);
        void reg.update().catch(() => {});
      })
      .catch(() => {});

    const recheck = () => {
      if (document.visibilityState === "visible") regRef.current?.update().catch(() => {});
    };
    document.addEventListener("visibilitychange", recheck);
    const interval = window.setInterval(recheck, 30 * 60 * 1000);

    // When our SKIP_WAITING lands and the new worker takes control, reload
    // onto it. Guarded so a first-ever activation doesn't bounce the page.
    const onController = () => {
      if (!askedRef.current || reloadingRef.current) return;
      reloadingRef.current = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onController);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", recheck);
      navigator.serviceWorker.removeEventListener("controllerchange", onController);
      window.clearInterval(interval);
    };
  }, []);

  const apply = useCallback(() => {
    if (!waiting) return;
    askedRef.current = true;
    setWaiting(null);
    waiting.postMessage({ type: "SKIP_WAITING" });
  }, [waiting]);

  return (
    <AnimatePresence>
      {waiting && (
        <motion.div
          className="fixed inset-x-0 z-50 flex justify-center px-4"
          style={{ top: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ type: "spring", stiffness: 280, damping: 26 }}
          role="status"
        >
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-[var(--surface)]/95 py-1.5 pl-4 pr-1.5 shadow-2xl backdrop-blur-xl">
            <span aria-hidden="true" className="text-base">✨</span>
            <span className="text-xs font-semibold text-[var(--text-primary)]">A fresher Dobby has arrived</span>
            <button onClick={apply} className="btn btn-primary btn-sm">
              Update
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

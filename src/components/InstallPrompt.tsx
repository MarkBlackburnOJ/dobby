"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/** Chrome-only, and not in lib.dom, so we describe the shape ourselves. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "dobby:install-dismissed";

/**
 * Android's install offer, on our terms.
 *
 * Chrome fires beforeinstallprompt once the site is installable; we swallow
 * its own infobar and hold the event so we can ask at a moment when the user
 * has actually met Dobby, rather than the instant the page loads. iOS never
 * fires this at all, so nothing here shows on an iPhone.
 */
export function InstallPrompt({ canPrompt }: { canPrompt: boolean }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // No service worker, no install offer — Chrome requires one that handles
    // fetch before it will consider the site installable at all.
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => {
        /* an unregistered worker only costs us the install banner */
      });
    }

    try {
      setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDeferred(null);

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    const event = deferred;
    setDeferred(null);
    await event.prompt();
    // Either way the event is spent; Chrome will re-fire it on a later visit
    // if they declined.
    await event.userChoice;
  }, [deferred]);

  const decline = useCallback(() => {
    setDeferred(null);
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* they'll just be asked again next visit */
    }
  }, []);

  const visible = Boolean(deferred) && canPrompt && !dismissed;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-x-0 z-50 flex justify-center px-4"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1.25rem)" }}
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 28 }}
          transition={{ type: "spring", stiffness: 280, damping: 26 }}
        >
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[var(--surface)]/95 p-5 shadow-2xl backdrop-blur-xl">
            <div className="flex gap-3.5">
              <div
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-xl"
                aria-hidden="true"
              >
                🪓
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-[var(--text-primary)]">Keep Dobby on your home screen</h2>
                <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                  Installs like an app and works with no signal. He'd rather you didn't, obviously.
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={decline} className="btn btn-ghost btn-sm flex-1">
                No thanks
              </button>
              <button onClick={install} className="btn btn-primary btn-sm flex-[1.6]">
                Install
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Dwarf } from "@/components/Dwarf";
import { useShake } from "@/lib/useShake";
import { pickVerdict, pickOne, IDLE_MUTTERS, PROTESTS, TONE_META, type Verdict, type Tone } from "@/lib/verdicts";
import { audio, haptic } from "@/lib/sound";
import { speech } from "@/lib/speech";
import { InstallPrompt } from "@/components/InstallPrompt";

export default function Home() {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [mood, setMood] = useState<"idle" | "shaking" | "delivering">("idle");
  const [damage, setDamage] = useState(0);
  const [impactSeed, setImpactSeed] = useState(0);
  const [shake, setShake] = useState({ armed: verdict === null });
  const [permission, setPermission] = useState<"prompt" | "granted" | "denied" | "unsupported">("prompt");
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speechOn, setSpeechOn] = useState(true);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [recentVerdicts, setRecentVerdicts] = useState<string[]>([]);
  const [protest, setProtest] = useState<string | null>(null);
  const protestTimeoutRef = useRef<number | undefined>(undefined);
  const speechTimeoutRef = useRef<number | undefined>(undefined);

  const shakeApi = useShake({
    armed: shake.armed,
    onTrigger: ({ intensity }) => {
      if (!shake.armed) return;
      audio.unlock();
      speech.unlock();
      
      const next = pickVerdict(undefined, recentVerdicts);
      setVerdict(next);
      setMood("delivering");
      setDamage(Math.min(damage + 1, 5));
      
      recentVerdicts.push(next.text);
      if (recentVerdicts.length > 8) recentVerdicts.shift();
      setRecentVerdicts([...recentVerdicts]);
      
      audio.verdict(next.tone);
      haptic([50, 100, 30, 100]);

      // Let the sting land first — he talks over its tail, not through it.
      window.clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = window.setTimeout(() => {
        if (!audio.muted) speech.say(next.text);
      }, 420);
      
      setShake({ armed: false });
      const id = window.setTimeout(() => {
        setShake({ armed: true });
        setMood("idle");
      }, 3800);
      return () => window.clearTimeout(id);
    },
    onHit: (force) => {
      audio.unlock();
      speech.unlock();
      audio.thud(force);
      audio.grunt(force);
      audio.glass(force);
      haptic([30, 60]);
      setImpactSeed((x) => x + 1);
      
      setProtest(pickOne(PROTESTS));
      window.clearTimeout(protestTimeoutRef.current);
      protestTimeoutRef.current = window.setTimeout(() => setProtest(null), 280);
      
      setDamage(Math.min(damage + 0.15, 5));
    },
  });

  const { requestAccess } = shakeApi;

  // Preferences live in localStorage, which the server cannot see. Reading
  // them during render desyncs hydration, so reconcile once we're on the client.
  useEffect(() => {
    setMuted(audio.muted);
    setSpeechOn(speech.enabled);
    setSpeechSupported(speech.supported);
  }, []);

  useEffect(
    () => () => {
      window.clearTimeout(protestTimeoutRef.current);
      window.clearTimeout(speechTimeoutRef.current);
      speech.stop();
    },
    [],
  );

  useEffect(() => {
    setPermission(shakeApi.permission);
  }, [shakeApi.permission]);

  // Only iOS 13+ hides motion behind an explicit gesture. Everywhere else the
  // listeners attach without ceremony, so take the grant ourselves rather than
  // making people tap a button that exists purely for Apple's benefit.
  useEffect(() => {
    const ctor = window.DeviceMotionEvent as unknown as
      | { requestPermission?: () => Promise<string> }
      | undefined;

    if (typeof ctor?.requestPermission === "function") {
      setShowPermissionBanner(true);
      return;
    }
    void requestAccess();
  }, [requestAccess]);

  const requestPermission = useCallback(async () => {
    audio.unlock();
    speech.unlock();
    const result = await shakeApi.requestAccess();
    setPermission(result);
    setShowPermissionBanner(false);
  }, [shakeApi]);

  const dismissPermission = useCallback(() => setShowPermissionBanner(false), []);

  const dismiss = useCallback(() => {
    window.clearTimeout(speechTimeoutRef.current);
    speech.stop();
    setVerdict(null);
    setMood("idle");
    setShake({ armed: true });
  }, []);

  const toggleMute = useCallback(() => {
    const next = !muted;
    setMuted(next);
    audio.setMuted(next);
    if (next) speech.stop();
  }, [muted]);

  const toggleSpeech = useCallback(() => {
    const next = !speechOn;
    setSpeechOn(next);
    speech.setEnabled(next);
  }, [speechOn]);

  const toggleBase =
    "grid h-12 w-12 place-items-center rounded-2xl text-xl transition active:scale-95 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 " +
    "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-dark)]";
  const toggleOn = "bg-white/15 text-white ring-1 ring-white/20 hover:bg-white/20";
  const toggleOff = "bg-white/5 text-gray-500 ring-1 ring-white/10 hover:bg-white/10";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-6 relative overflow-hidden">
      {/* Radial gradient backdrop */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-transparent via-transparent to-black/20" />

      {/* Main chamber */}
      <motion.div
        className="flex-1 flex items-center justify-center w-full max-w-sm relative z-10"
        animate={{ scale: mood === "shaking" ? 0.98 : 1 }}
        transition={{ duration: 0.12 }}
      >
        <div
          className="w-full aspect-square rounded-3xl border-8 border-gray-700 bg-gradient-to-br from-gray-900 to-gray-950 flex items-center justify-center shadow-2xl relative overflow-hidden cursor-grab active:cursor-grabbing"
          {...shakeApi.dragHandlers}
        >
          {/* Glass inner glow */}
          <div className="absolute inset-0 rounded-3xl ring-1 ring-white/10 pointer-events-none" />

          <Dwarf
            intensity={shakeApi.intensity}
            damage={damage}
            mood={mood}
            impactSeed={impactSeed}
            reducedMotion={reducedMotion}
          />

          {/* Impact flash */}
          <AnimatePresence>
            {impactSeed > 0 && (
              <motion.div
                className="absolute inset-0 rounded-3xl bg-white/20 pointer-events-none"
                initial={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            )}
          </AnimatePresence>

          {/* Protest speech bubble */}
          <AnimatePresence>
            {protest && (
              <motion.div
                className="absolute top-8 left-1/2 -translate-x-1/2 z-20"
                initial={{ opacity: 0, scale: 0.6, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.6, y: 10 }}
                transition={{ duration: 0.18 }}
              >
                <div className="bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-lg">
                  {protest}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Verdict card */}
      <AnimatePresence mode="wait">
        {verdict && (
          <motion.div
            className="mt-8 w-full max-w-sm"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <div
              role="status"
              aria-live="polite"
              className="rounded-2xl p-6 backdrop-blur-md border"
              style={{
                backgroundColor: `${TONE_META[verdict.tone as Tone].glow}`,
                borderColor: TONE_META[verdict.tone as Tone].accent,
                boxShadow: `0 0 20px ${TONE_META[verdict.tone as Tone].glow}`,
              }}
            >
              <div className="text-xs font-bold tracking-wider mb-2" style={{ color: TONE_META[verdict.tone as Tone].accent }}>
                {TONE_META[verdict.tone as Tone].label}
              </div>
              <p className="text-lg font-semibold leading-tight mb-4 text-gray-100">{verdict.text}</p>
              <button
                onClick={dismiss}
                className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium text-gray-200"
              >
                Ask Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="mt-8 flex items-center justify-center gap-2.5 w-full z-20">
        <button
          onClick={shakeApi.poke}
          disabled={!shake.armed}
          className="h-12 px-7 rounded-2xl bg-blue-600 text-white font-bold tracking-tight shadow-lg shadow-blue-950/40 transition enabled:hover:bg-blue-500 enabled:active:scale-95 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-dark)]"
        >
          Poke Dobby
        </button>
        <button
          onClick={toggleMute}
          aria-pressed={!muted}
          title={muted ? "Sound off" : "Sound on"}
          aria-label={muted ? "Turn sound on" : "Turn sound off"}
          className={`${toggleBase} ${muted ? toggleOff : toggleOn}`}
        >
          {muted ? "🔇" : "🔊"}
        </button>
        {speechSupported && (
          <button
            onClick={toggleSpeech}
            aria-pressed={speechOn}
            title={speechOn ? "Dobby speaks his verdict" : "Dobby stays quiet"}
            aria-label={speechOn ? "Silence Dobby's voice" : "Let Dobby speak"}
            className={`${toggleBase} ${speechOn ? toggleOn : toggleOff}`}
          >
            {speechOn ? "🗣️" : "🤐"}
          </button>
        )}
      </div>

      {/* No sensors. Inline, rather than a fixed bar fighting the controls. */}
      {(permission === "denied" || permission === "unsupported") && (
        <p className="mt-4 flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-xs text-[var(--text-secondary)] ring-1 ring-white/10">
          <span aria-hidden="true">📱</span>
          No motion sensors — poke him or drag the chamber instead.
        </p>
      )}

      {/* Android's install offer. Held back until he has delivered at least
          one verdict, so we're asking someone who knows what they'd install. */}
      <InstallPrompt canPrompt={recentVerdicts.length > 0} />

      {/* Motion permission — iOS only, and it clears the safe area instead of
          landing on top of the controls the way the old fixed banner did. */}
      <AnimatePresence>
        {showPermissionBanner && permission === "prompt" && (
          <motion.div
            className="fixed inset-x-0 z-40 flex justify-center px-4"
            style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1.25rem)" }}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 28 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
          >
            <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[var(--surface)]/95 p-5 shadow-2xl backdrop-blur-xl">
              <div className="flex gap-3.5">
                <div
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-500/15 text-xl"
                  aria-hidden="true"
                >
                  📳
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-[var(--text-primary)]">
                    Let Dobby feel the shaking
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                    He needs your motion sensors. Nothing leaves your phone.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={dismissPermission}
                  className="h-11 flex-1 rounded-xl text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-white/5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                >
                  Not now
                </button>
                <button
                  onClick={requestPermission}
                  className="h-11 flex-[1.6] rounded-xl bg-amber-500 text-sm font-bold text-gray-950 shadow-lg shadow-amber-950/30 transition hover:bg-amber-400 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
                >
                  Enable shake
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Idle mutter */}
      {mood === "idle" && shake.armed && !verdict && (
        <motion.div
          className="mt-4 text-gray-400 text-sm italic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          {pickOne(IDLE_MUTTERS)}
        </motion.div>
      )}
    </main>
  );
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);
  return matches;
}

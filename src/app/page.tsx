"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Dwarf } from "@/components/Dwarf";
import { useShake, type ImpactKind } from "@/lib/useShake";
import { pickVerdict, pickOne, IDLE_MUTTERS, PROTESTS, TONE_META, type Verdict, type Tone } from "@/lib/verdicts";
import { audio, haptic } from "@/lib/sound";
import { speech } from "@/lib/speech";
import { InstallPrompt } from "@/components/InstallPrompt";
import { UpdatePrompt } from "@/components/UpdatePrompt";

/** Twenty-five tiers of visible regret: one plaster, then blood, dismemberment, and the afterlife. */
const MAX_DAMAGE = 25;

/** Each kind of blow lands differently — its own vibration and its own bite. */
const HIT_HAPTICS: Record<ImpactKind, number | number[]> = {
  tap: 18,
  whack: [30, 50, 25],
  rattle: [12, 18, 12, 18, 12],
  slam: [70, 40, 90],
};
const HIT_DAMAGE: Record<ImpactKind, number> = {
  tap: 0.06,
  whack: 0.16,
  rattle: 0.1,
  slam: 0.34,
};

export default function Home() {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [mood, setMood] = useState<"idle" | "shaking" | "delivering">("idle");
  const [damage, setDamage] = useState(0);
  const [impactSeed, setImpactSeed] = useState(0);
  const [impactForce, setImpactForce] = useState(0);
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
    onTrigger: ({ style }) => {
      if (!shake.armed) return;
      audio.unlock();
      speech.unlock();
      
      // A gentle nudge leans kind; a violent thrashing leans cruel and chaotic.
      const bias =
        style.fury > 0.6
          ? { no: 1.8, chaotic: 1.7, yes: 0.6 }
          : style.fury < 0.25
            ? { yes: 1.7, maybe: 1.4, no: 0.7 }
            : undefined;
      const next = pickVerdict(undefined, recentVerdicts, bias);
      setVerdict(next);
      setMood("delivering");
      setDamage((d) => Math.min(d + 1 + style.fury * 0.8, MAX_DAMAGE));
      
      recentVerdicts.push(next.text);
      if (recentVerdicts.length > 8) recentVerdicts.shift();
      setRecentVerdicts([...recentVerdicts]);
      
      audio.verdict(next.tone);
      haptic(style.fury > 0.5 ? [60, 110, 40, 130] : [40, 80, 30, 80]);

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
    onHit: ({ force, kind, axis }) => {
      audio.unlock();
      speech.unlock();
      audio.impact(kind, force, axis);
      haptic(HIT_HAPTICS[kind]);
      setImpactSeed((x) => x + 1);
      setImpactForce(force);
      
      setProtest(pickOne(PROTESTS));
      window.clearTimeout(protestTimeoutRef.current);
      protestTimeoutRef.current = window.setTimeout(() => setProtest(null), 280);
      
      setDamage((d) => Math.min(d + HIT_DAMAGE[kind] * (0.6 + force * 0.8), MAX_DAMAGE));
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

  return (
    <main className="h-full flex flex-col items-center px-3 py-3 relative overflow-hidden">
      {/* Radial gradient backdrop */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-transparent via-transparent to-black/20" />

      {/* Main chamber */}
      <motion.div
        className="flex-1 min-h-0 w-full relative z-10"
        animate={{ scale: mood === "shaking" ? 0.98 : 1 }}
        transition={{ duration: 0.12 }}
      >
        <div
          className="h-full w-full rounded-3xl border-4 border-gray-700 bg-gradient-to-br from-gray-900 to-gray-950 shadow-2xl relative overflow-hidden cursor-grab active:cursor-grabbing select-none touch-none"
          {...shakeApi.dragHandlers}
        >
          {/* Glass inner glow */}
          <div className="absolute inset-0 rounded-3xl ring-1 ring-white/10 pointer-events-none" />

          <Dwarf
            intensity={shakeApi.intensity}
            damage={damage}
            mood={mood}
            impactSeed={impactSeed}
            impactForce={impactForce}
            reducedMotion={reducedMotion}
          />

          {/* Impact flash */}
          <AnimatePresence>
            {impactSeed > 0 && (
              <motion.div
                className={`absolute inset-0 rounded-3xl pointer-events-none ${damage >= 13 ? "bg-red-700/30" : "bg-white/20"}`}
                initial={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            )}
          </AnimatePresence>

          {/* Blood on the inside of the glass — it accrues as he does. */}
          {damage >= 13 && (
            <svg
              className="absolute inset-0 h-full w-full pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{ opacity: Math.min((damage - 12) / 4, 1) * 0.8 }}
              aria-hidden="true"
            >
              <g fill="#7d1414">
                <path d="M8 14 q2 8 -1 16 q3 -6 5 -1 q1 -7 -4 -15 z" />
                <path d="M92 22 q3 10 0 20 q4 -7 5 0 q2 -9 -5 -20 z" />
                <circle cx="14" cy="40" r="1.6" />
                <circle cx="88" cy="12" r="1.9" />
                <circle cx="83" cy="47" r="1.2" />
                <circle cx="20" cy="9" r="1.3" />
              </g>
              <g fill="#9e1a1a">
                <path d="M50 5 q2 12 -1 22 q3 -7 5 -1 q2 -10 -4 -21 z" />
                <circle cx="70" cy="30" r="1.4" />
                <circle cx="30" cy="54" r="1.5" />
              </g>
            </svg>
          )}

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
            className="mt-6 w-full max-w-sm"
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
                className="btn btn-tone btn-sm w-full"
                style={{ ["--tone" as string]: TONE_META[verdict.tone as Tone].accent }}
              >
                Ask Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="mt-6 flex items-center justify-center gap-2.5 w-full z-20">
        <button onClick={shakeApi.poke} disabled={!shake.armed} className="btn btn-primary">
          Poke Dobby
        </button>
        <button
          onClick={toggleMute}
          aria-pressed={!muted}
          title={muted ? "Sound off" : "Sound on"}
          aria-label={muted ? "Turn sound on" : "Turn sound off"}
          className={`btn btn-icon ${muted ? "btn-icon-off" : "btn-icon-on"}`}
        >
          {muted ? "🔇" : "🔊"}
        </button>
        {speechSupported && (
          <button
            onClick={toggleSpeech}
            aria-pressed={speechOn}
            title={speechOn ? "Dobby speaks his verdict" : "Dobby stays quiet"}
            aria-label={speechOn ? "Silence Dobby's voice" : "Let Dobby speak"}
            className={`btn btn-icon ${speechOn ? "btn-icon-on" : "btn-icon-off"}`}
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

      {/* Keeps an installed copy current: a standalone PWA has no reload
          button, so it offers a tap when a fresh deploy is waiting. */}
      <UpdatePrompt />

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
                <button onClick={dismissPermission} className="btn btn-ghost btn-sm flex-1">
                  Not now
                </button>
                <button onClick={requestPermission} className="btn btn-primary btn-sm flex-[1.6]">
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

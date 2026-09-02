"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Dwarf } from "@/components/Dwarf";
import { useShake } from "@/lib/useShake";
import { pickVerdict, pickOne, IDLE_MUTTERS, PROTESTS, TONE_META, type Verdict, type Tone } from "@/lib/verdicts";
import { audio, haptic } from "@/lib/sound";
import { speech } from "@/lib/speech";

export default function Home() {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [mood, setMood] = useState<"idle" | "shaking" | "delivering">("idle");
  const [damage, setDamage] = useState(0);
  const [impactSeed, setImpactSeed] = useState(0);
  const [shake, setShake] = useState({ armed: verdict === null });
  const [permission, setPermission] = useState<"prompt" | "granted" | "denied" | "unsupported">("prompt");
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);
  const [muted, setMuted] = useState(audio.muted);
  const [speechOn, setSpeechOn] = useState(speech.enabled);
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

  useEffect(() => {
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
    if (shakeApi.permission === "prompt" && window.innerHeight < 800) {
      setShowPermissionBanner(true);
    }
  }, [shakeApi.permission]);

  const requestPermission = useCallback(async () => {
    audio.unlock();
    speech.unlock();
    const result = await shakeApi.requestAccess();
    setPermission(result);
    setShowPermissionBanner(false);
  }, [shakeApi]);

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

      {/* Bottom controls */}
      <div className="mt-8 flex gap-3 justify-center w-full z-20">
        <button
          onClick={shakeApi.poke}
          disabled={!shake.armed}
          className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-colors shadow-lg"
        >
          Poke Doddy
        </button>
        <button
          onClick={toggleMute}
          className="px-4 py-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white font-bold transition-colors shadow-lg"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? "🔇" : "🔊"}
        </button>
        {speechSupported && (
          <button
            onClick={toggleSpeech}
            className="px-4 py-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white font-bold transition-colors shadow-lg"
            aria-label={speechOn ? "Silence Doddy's voice" : "Let Doddy speak"}
            aria-pressed={speechOn}
          >
            {speechOn ? "🗣️" : "🤐"}
          </button>
        )}
      </div>

      {/* Permission prompt banner */}
      {showPermissionBanner && permission === "prompt" && (
        <motion.div
          className="fixed bottom-6 left-6 right-6 bg-amber-600/90 backdrop-blur-md rounded-lg p-4 text-white z-40 max-w-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <p className="text-sm font-medium mb-3">
            Doddy needs motion sensors to detect shakes. Grant permission to begin.
          </p>
          <button
            onClick={requestPermission}
            className="w-full py-2 rounded bg-white/20 hover:bg-white/30 text-white font-bold transition-colors"
          >
            Enable Shake
          </button>
        </motion.div>
      )}

      {/* Degraded input banner (no sensors) */}
      {permission === "denied" && !showPermissionBanner && (
        <div className="fixed top-6 left-6 right-6 bg-gray-700/80 backdrop-blur-sm rounded-lg px-3 py-2 text-gray-300 text-xs z-30 max-w-sm">
          📱 Use "Poke Doddy" or drag the chamber to shake (no motion sensors).
        </div>
      )}

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

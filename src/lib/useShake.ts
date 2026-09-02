"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMotionValue, type MotionValue } from "framer-motion";

export type MotionPermission = "prompt" | "granted" | "denied" | "unsupported";

/** iOS 13+ gates DeviceMotion behind an explicit, gesture-initiated grant. */
interface DeviceMotionEventCtor {
  requestPermission?: () => Promise<"granted" | "denied">;
}

interface UseShakeOptions {
  /** While false, energy still decays but never fires a verdict. */
  armed: boolean;
  onTrigger: (payload: { intensity: number; hits: number }) => void;
  /** Fired on each distinct impact — drives impact flashes, thuds, haptics. */
  onHit?: (force: number) => void;
}

// Tuned against real hardware feel: a purposeful wrist-flick reads ~12-25 m/s².
const NOISE_FLOOR = 2.6; // m/s² of linear accel we treat as "not shaking"
const HIT_FORCE = 5.5; // linear accel that counts as Dobby hitting the glass
const HIT_REFRACTORY = 110; // ms between countable impacts
const ENERGY_MAX = 46; // energy value that maps to intensity 1.0
const TRIGGER_ENERGY = 26; // energy needed to shake an answer loose
const DECAY_PER_SEC = 2.9; // exponential falloff
const COOLDOWN_MS = 900; // stops one long shake firing repeatedly

export interface ShakeApi {
  /** 0→1, updated off the React render loop for 60fps animation. */
  intensity: MotionValue<number>;
  permission: MotionPermission;
  /** True once we've actually received usable accelerometer data. */
  hasSensor: boolean;
  requestAccess: () => Promise<MotionPermission>;
  /** Pointer handlers for shaking Dobby by hand (desktop / denied sensors). */
  dragHandlers: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
  };
  /** Simulated shake for the on-screen button. */
  poke: () => void;
}

export function useShake({ armed, onTrigger, onHit }: UseShakeOptions): ShakeApi {
  const intensity = useMotionValue(0);
  const [permission, setPermission] = useState<MotionPermission>("prompt");
  const [hasSensor, setHasSensor] = useState(false);

  const energy = useRef(0);
  const hits = useRef(0);
  const gravity = useRef({ x: 0, y: 0, z: 0 });
  const gravitySeeded = useRef(false);
  const lastHitAt = useRef(0);
  const lastFireAt = useRef(0);
  const pokeUntil = useRef(0);

  // Keep callbacks in refs so the rAF/listener loops never need re-binding.
  const armedRef = useRef(armed);
  const triggerRef = useRef(onTrigger);
  const hitRef = useRef(onHit);
  useEffect(() => {
    armedRef.current = armed;
    triggerRef.current = onTrigger;
    hitRef.current = onHit;
  });

  /** Shared entry point for every input source: sensor, pointer, button. */
  const addEnergy = useCallback(
    (force: number) => {
      if (force <= 0) return;
      energy.current = Math.min(energy.current + force, ENERGY_MAX * 1.35);

      const now = performance.now();
      if (force >= HIT_FORCE && now - lastHitAt.current > HIT_REFRACTORY) {
        lastHitAt.current = now;
        hits.current += 1;
        hitRef.current?.(Math.min(force / 18, 1));
      }
    },
    [],
  );

  // ── Accelerometer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !("DeviceMotionEvent" in window)) {
      setPermission("unsupported");
      return;
    }
    if (permission !== "granted") return;

    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a || a.x === null || a.y === null || a.z === null) return;

      if (!hasSensor) setHasSensor(true);

      // Low-pass the signal to estimate gravity, then subtract it out so we
      // only respond to real movement rather than device orientation.
      const g = gravity.current;
      if (!gravitySeeded.current) {
        g.x = a.x; g.y = a.y; g.z = a.z;
        gravitySeeded.current = true;
        return;
      }
      const alpha = 0.82;
      g.x = alpha * g.x + (1 - alpha) * a.x;
      g.y = alpha * g.y + (1 - alpha) * a.y;
      g.z = alpha * g.z + (1 - alpha) * a.z;

      const lx = a.x - g.x;
      const ly = a.y - g.y;
      const lz = a.z - g.z;
      const magnitude = Math.hypot(lx, ly, lz);

      if (magnitude > NOISE_FLOOR) addEnergy((magnitude - NOISE_FLOOR) * 0.55);
    };

    window.addEventListener("devicemotion", onMotion);
    return () => window.removeEventListener("devicemotion", onMotion);
  }, [permission, hasSensor, addEnergy]);

  // ── Decay + trigger loop ────────────────────────────────────────────────
  useEffect(() => {
    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;

      if (now < pokeUntil.current) addEnergy(2.4);

      energy.current *= Math.exp(-DECAY_PER_SEC * dt);
      if (energy.current < 0.05) {
        energy.current = 0;
        hits.current = 0;
      }

      intensity.set(Math.min(energy.current / ENERGY_MAX, 1));

      if (
        armedRef.current &&
        energy.current >= TRIGGER_ENERGY &&
        now - lastFireAt.current > COOLDOWN_MS
      ) {
        lastFireAt.current = now;
        triggerRef.current({
          intensity: Math.min(energy.current / ENERGY_MAX, 1),
          hits: Math.max(hits.current, 1),
        });
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [intensity, addEnergy]);

  // ── Permission ──────────────────────────────────────────────────────────
  const requestAccess = useCallback(async (): Promise<MotionPermission> => {
    if (typeof window === "undefined" || !("DeviceMotionEvent" in window)) {
      setPermission("unsupported");
      return "unsupported";
    }

    const ctor = window.DeviceMotionEvent as unknown as DeviceMotionEventCtor;
    if (typeof ctor.requestPermission !== "function") {
      // Android / desktop: no prompt, listeners just work (over HTTPS).
      setPermission("granted");
      return "granted";
    }

    try {
      const result = await ctor.requestPermission();
      const next: MotionPermission = result === "granted" ? "granted" : "denied";
      setPermission(next);
      return next;
    } catch {
      setPermission("denied");
      return "denied";
    }
  }, []);

  // ── Manual shaking (desktop, or when sensors are unavailable) ───────────
  const dragging = useRef(false);
  const lastPoint = useRef({ x: 0, y: 0, t: 0 });

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    lastPoint.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      const now = performance.now();
      const dt = now - lastPoint.current.t;
      if (dt < 8) return;

      const dist = Math.hypot(e.clientX - lastPoint.current.x, e.clientY - lastPoint.current.y);
      lastPoint.current = { x: e.clientX, y: e.clientY, t: now };

      // px/ms → roughly the same scale the accelerometer produces.
      addEnergy(Math.min((dist / dt) * 7, 16));
    },
    [addEnergy],
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    dragging.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }, []);

  const poke = useCallback(() => {
    pokeUntil.current = performance.now() + 620;
  }, []);

  return {
    intensity,
    permission,
    hasSensor,
    requestAccess,
    dragHandlers: { onPointerDown, onPointerMove, onPointerUp },
    poke,
  };
}

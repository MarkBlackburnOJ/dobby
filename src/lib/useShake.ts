"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMotionValue, type MotionValue } from "framer-motion";

export type MotionPermission = "prompt" | "granted" | "denied" | "unsupported";

/** iOS 13+ gates DeviceMotion behind an explicit, gesture-initiated grant. */
interface DeviceMotionEventCtor {
  requestPermission?: () => Promise<"granted" | "denied">;
}

export type ImpactKind = "tap" | "whack" | "rattle" | "slam";

/** A single glass impact, classified by how it was thrown. */
export interface Impact {
  /** 0→1 magnitude. */
  force: number;
  kind: ImpactKind;
  /** Dominant axis of the blow — a little audio variation rides on it. */
  axis: "x" | "y" | "z";
}

/** The character of a whole shake, summarised when a verdict shakes loose. */
export interface ShakeStyle {
  kind: ImpactKind;
  /** 0→1 hardest blow of the shake. */
  peak: number;
  /** 0→1 overall aggression — biases which answers surface. */
  fury: number;
}

interface UseShakeOptions {
  /** While false, energy still decays but never fires a verdict. */
  armed: boolean;
  onTrigger: (payload: { intensity: number; hits: number; style: ShakeStyle }) => void;
  /** Fired on each distinct impact — drives impact flashes, thuds, haptics. */
  onHit?: (impact: Impact) => void;
}

// Tuned against real hardware feel: a purposeful wrist-flick reads ~12-25 m/s².
const NOISE_FLOOR = 2.6; // m/s² of linear accel we treat as "not shaking"
const HIT_FORCE = 5.5; // linear accel that counts as Dobby hitting the glass
const WHACK_FORCE = 9; // a solid, single blow
const SLAM_FORCE = 14; // a genuinely violent one
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
  const recentHits = useRef<number[]>([]);
  const peakForce = useRef(0);
  const slamCount = useRef(0);
  const rattleCount = useRef(0);
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
    (force: number, axis: "x" | "y" | "z" = "y") => {
      if (force <= 0) return;
      energy.current = Math.min(energy.current + force, ENERGY_MAX * 1.35);
      peakForce.current = Math.max(peakForce.current, force);

      const now = performance.now();
      if (force >= HIT_FORCE && now - lastHitAt.current > HIT_REFRACTORY) {
        lastHitAt.current = now;
        hits.current += 1;

        // Cadence: blows landed in the last half-second. A fast flurry reads as
        // a rattle no matter how hard any single blow is.
        const rh = recentHits.current;
        rh.push(now);
        while (rh.length && now - rh[0] > 700) rh.shift();
        const cadence = rh.reduce((n, ts) => (now - ts <= 500 ? n + 1 : n), 0);

        let kind: ImpactKind;
        if (cadence >= 3) {
          kind = "rattle";
          rattleCount.current += 1;
        } else if (force >= SLAM_FORCE) {
          kind = "slam";
          slamCount.current += 1;
        } else if (force >= WHACK_FORCE) {
          kind = "whack";
        } else {
          kind = "tap";
        }

        hitRef.current?.({ force: Math.min(force / 18, 1), kind, axis });
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

      if (magnitude > NOISE_FLOOR) {
        const ax = Math.abs(lx);
        const ay = Math.abs(ly);
        const az = Math.abs(lz);
        const axis = ax >= ay && ax >= az ? "x" : ay >= az ? "y" : "z";
        addEnergy((magnitude - NOISE_FLOOR) * 0.55, axis);
      }
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
        recentHits.current.length = 0;
        peakForce.current = 0;
        slamCount.current = 0;
        rattleCount.current = 0;
      }

      intensity.set(Math.min(energy.current / ENERGY_MAX, 1));

      if (
        armedRef.current &&
        energy.current >= TRIGGER_ENERGY &&
        now - lastFireAt.current > COOLDOWN_MS
      ) {
        lastFireAt.current = now;

        const peak = Math.min(peakForce.current / 20, 1);
        const fury = Math.min(peak * 0.7 + slamCount.current * 0.12, 1);
        const kind: ImpactKind =
          rattleCount.current >= 2
            ? "rattle"
            : slamCount.current >= 1 || peak >= 0.7
              ? "slam"
              : peak >= 0.45
                ? "whack"
                : "tap";

        triggerRef.current({
          intensity: Math.min(energy.current / ENERGY_MAX, 1),
          hits: Math.max(hits.current, 1),
          style: { kind, peak, fury },
        });

        // Fresh slate for the next shake's character.
        peakForce.current = 0;
        slamCount.current = 0;
        rattleCount.current = 0;
        recentHits.current.length = 0;
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

      const dx = e.clientX - lastPoint.current.x;
      const dy = e.clientY - lastPoint.current.y;
      const dist = Math.hypot(dx, dy);
      lastPoint.current = { x: e.clientX, y: e.clientY, t: now };

      // px/ms → roughly the same scale the accelerometer produces.
      addEnergy(Math.min((dist / dt) * 7, 16), Math.abs(dx) >= Math.abs(dy) ? "x" : "y");
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

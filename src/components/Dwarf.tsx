"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";

export type Mood = "idle" | "shaking" | "delivering";

interface DwarfProps {
  /** 0→1 shake energy, updated outside React. */
  intensity: MotionValue<number>;
  /** 0→25. Accumulated abuse: plasters, blood, dismemberment, then the afterlife. */
  damage: number;
  mood: Mood;
  /** Bumped on every glass impact to fire the squash + flash. */
  impactSeed: number;
  /** 0→1 magnitude of the latest impact, so a slam squashes harder than a tap. */
  impactForce: number;
  reducedMotion: boolean;
}

/**
 * Dobby, rendered as one SVG with independently sprung parts.
 *
 * The trick that sells the whole thing is drag: the body is driven directly by
 * shake energy, while the hat, beard, arms and legs follow it through springs
 * of increasing looseness. Rendering the *difference* between the body and each
 * lagging spring gives proper follow-through — the beard swings after the head
 * stops, the arms flail a beat late — without simulating any real physics.
 */
export function Dwarf({ intensity, damage, mood, impactSeed, impactForce, reducedMotion }: DwarfProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  /**
   * How far he can travel before he's up against the glass. Measured rather
   * than guessed, so he makes contact on any screen shape. offsetWidth, not
   * getBoundingClientRect, or his own transform would feed back into it.
   */
  const travel = useRef({ x: 0, y: 0 });
  const [, setMeasured] = useState(0);

  useEffect(() => {
    const stage = stageRef.current;
    const body = bodyRef.current;
    if (!stage || !body) return;

    // His silhouette doesn't fill the viewBox — there's headroom around it for
    // the hat and the arms to swing through. Measuring the element alone would
    // stop him a visible gap short of the glass, so discount that padding.
    const ART_WIDTH = 0.76;
    const ART_HEIGHT = 0.9;

    const measure = () => {
      travel.current = {
        x: Math.max(0, (stage.offsetWidth - body.offsetWidth * ART_WIDTH) / 2),
        y: Math.max(0, (stage.offsetHeight - body.offsetHeight * ART_HEIGHT) / 2),
      };
      setMeasured((n) => n + 1);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    observer.observe(body);
    return () => observer.disconnect();
  }, []);

  const bodyX = useMotionValue(0);
  const bodyY = useMotionValue(0);
  const bodyRot = useMotionValue(0);
  const breathe = useMotionValue(1);

  // Squash-and-stretch, pulsed on impact.
  const squash = useSpring(0, { stiffness: 700, damping: 16, mass: 0.5 });
  /** True while he's held against the glass, so one contact fires one squash. */
  const wallContact = useRef(false);

  useEffect(() => {
    if (impactSeed === 0 || reducedMotion) return;
    // A tap barely dents him; a slam flattens him against the glass.
    squash.set(Math.min(0.5 + impactForce * 0.7, 1));
    const id = window.setTimeout(() => squash.set(0), 60 + impactForce * 40);
    return () => window.clearTimeout(id);
  }, [impactSeed, impactForce, squash, reducedMotion]);

  // ── Drive the body from shake energy ────────────────────────────────────
  useAnimationFrame((t) => {
    const i = reducedMotion ? 0 : intensity.get();
    const s = t / 1000;

    // Incommensurable frequencies => organic, never-repeating wobble.
    if (i > 0.002) {
      // Deliberately overshoots ±1 so hard shakes pin him against the glass
      // instead of politely approaching it.
      const rawX = (Math.sin(s * 23.3) * 0.62 + Math.sin(s * 41.7 + 2.1) * 0.38) * 1.45 * i;
      const rawY = (Math.sin(s * 19.1 + 1.3) * 0.6 + Math.sin(s * 37.3 + 0.4) * 0.4) * 1.45 * i;

      const clampedX = Math.max(-1, Math.min(1, rawX));
      const clampedY = Math.max(-1, Math.min(1, rawY));

      bodyX.set(clampedX * travel.current.x);
      bodyY.set(clampedY * travel.current.y);
      bodyRot.set((Math.sin(s * 15.7 + 0.7) * 0.7 + Math.sin(s * 31.1 + 1.9) * 0.3) * 26 * i);

      // Squash him against whichever wall he's pinned to.
      const against = Math.abs(rawX) >= 1 || Math.abs(rawY) >= 1;
      if (against && !wallContact.current) squash.set(1);
      wallContact.current = against;
    } else {
      // Barely holding together: a fine tremor once he's really hurt.
      const tremor =
        !reducedMotion && mood !== "shaking" && damage >= 13
          ? Math.min((damage - 12) / 4, 1)
          : 0;
      if (tremor > 0) {
        bodyX.set(Math.sin(s * 46) * 1.1 * tremor);
        bodyY.set(Math.cos(s * 39) * 0.7 * tremor);
        bodyRot.set(Math.sin(s * 53) * 0.9 * tremor);
      } else if (bodyX.get() !== 0) {
        bodyX.set(0);
        bodyY.set(0);
        bodyRot.set(0);
      }
    }

    // Idle breathing, suppressed while he's being flung about.
    breathe.set(reducedMotion ? 1 : 1 + Math.sin(s * 1.9) * 0.016 * (1 - i));
  });

  // ── Secondary motion: each part trails the body by a different amount ───
  const hatLag = useSpring(bodyRot, { stiffness: 260, damping: 11, mass: 0.7 });
  const beardLag = useSpring(bodyRot, { stiffness: 110, damping: 9, mass: 1.1 });
  const armLag = useSpring(bodyRot, { stiffness: 85, damping: 7, mass: 1.3 });
  const legLag = useSpring(bodyRot, { stiffness: 130, damping: 8, mass: 0.9 });

  const hatRot = useTransform([bodyRot, hatLag], ([r, l]: number[]) => (r - l) * 1.5);
  const beardRot = useTransform([bodyRot, beardLag], ([r, l]: number[]) => (r - l) * 2.1);
  const armRot = useTransform([bodyRot, armLag], ([r, l]: number[]) => (r - l) * 3.4);
  const armRotMirror = useTransform(armRot, (v) => -v * 0.85);
  const legRot = useTransform([bodyRot, legLag], ([r, l]: number[]) => (r - l) * 2.6);

  // Hat also slides down over his eyes the harder he's shaken.
  const hatDrop = useTransform(intensity, [0, 1], [0, 9]);

  const scaleX = useTransform(squash, [0, 1], [1, 1.16]);
  const scaleY = useTransform([squash, breathe], ([s, b]: number[]) => (1 - s * 0.14) * b);

  // ── Face ────────────────────────────────────────────────────────────────
  const [blinking, setBlinking] = useState(false);
  useEffect(() => {
    if (reducedMotion) return;
    let timer: number;
    const schedule = () => {
      timer = window.setTimeout(() => {
        setBlinking(true);
        window.setTimeout(() => setBlinking(false), 120);
        schedule();
      }, 2600 + Math.random() * 4200);
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, [reducedMotion]);

  const eyes: "open" | "blink" | "squeezed" | "dead" | "dizzy" =
    mood === "shaking" ? (damage >= 3 ? "dizzy" : "squeezed")
      : damage >= 4 ? "dead"
      : blinking ? "blink"
      : "open";

  const showStars = damage >= 2 && mood !== "idle";

  return (
    <div ref={stageRef} className="dwarf-stage">
      <motion.div ref={bodyRef} className="dwarf-body" style={{ x: bodyX, y: bodyY }}>
        <svg
          viewBox="0 0 200 240"
          className="dwarf-svg"
          aria-hidden="true"
          shapeRendering="geometricPrecision"
        >
      <defs>
        <linearGradient id="d-hat" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor="#e0663a" />
          <stop offset="55%" stopColor="#bf4a26" />
          <stop offset="100%" stopColor="#8c3117" />
        </linearGradient>
        <linearGradient id="d-skin" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#f2b78c" />
          <stop offset="60%" stopColor="#dd9466" />
          <stop offset="100%" stopColor="#bd7449" />
        </linearGradient>
        <linearGradient id="d-nose" x1="0.3" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="#ef9f77" />
          <stop offset="100%" stopColor="#c9714a" />
        </linearGradient>
        <linearGradient id="d-beard" x1="0.25" y1="0" x2="0.75" y2="1">
          <stop offset="0%" stopColor="#fbf3e2" />
          <stop offset="55%" stopColor="#e3d6ba" />
          <stop offset="100%" stopColor="#bfae8d" />
        </linearGradient>
        <linearGradient id="d-tunic" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#3d8b85" />
          <stop offset="100%" stopColor="#1d504e" />
        </linearGradient>
        <linearGradient id="d-band" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f7cf6b" />
          <stop offset="100%" stopColor="#d19a2c" />
        </linearGradient>
        <linearGradient id="d-boot" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5d4230" />
          <stop offset="100%" stopColor="#38251a" />
        </linearGradient>
        <radialGradient id="d-cheek" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#e2604a" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#e2604a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="d-bruise" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#8f6fd0" stopOpacity="0.85" />
          <stop offset="70%" stopColor="#6b4fa8" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#6b4fa8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="d-blood" cx="0.5" cy="0.4" r="0.6">
          <stop offset="0%" stopColor="#e0352b" />
          <stop offset="60%" stopColor="#b21f1f" />
          <stop offset="100%" stopColor="#7d1414" />
        </radialGradient>
      </defs>

      {/* Everything hangs off this one group so the whole dwarf moves as a unit. */}
      <motion.g
        style={{
          rotate: bodyRot,
          scaleX,
          scaleY,
          transformBox: "view-box",
          transformOrigin: "100px 150px",
        }}
      >
        {/* ── Legs + boots ──────────────────────────────────────────────── */}
        <motion.g
          style={{ rotate: legRot, transformBox: "view-box", transformOrigin: "100px 186px" }}
        >
          {[78, 122].map((x, i) => (
            <g key={x}>
              {((i === 0 && damage >= 11) || (i === 1 && damage >= 18)) ? (
                <g>
                  {/* Left leg's a long wooden peg — pointed and pale so it juts
                      clear of the beard and boot, and you can see the damage done. */}
                  <rect x={x - 12} y={177} width={24} height={9} rx={2} fill="#3b2a20" stroke="#1c130f" strokeWidth={2.6} />
                  <path
                    d={`M ${x - 9} 185 h 18 l -7 53 h -4 z`}
                    fill="#a97846"
                    stroke="#1c130f"
                    strokeWidth={3}
                    strokeLinejoin="round"
                  />
                  <path
                    d={`M ${x - 6} 196 h 13 M ${x - 5} 208 h 11 M ${x - 4} 220 h 8`}
                    stroke="#6b4526"
                    strokeWidth={1.5}
                    opacity={0.55}
                  />
                </g>
              ) : (
                <>
                  <rect
                    x={x - 9}
                    y={182}
                    width={18}
                    height={26}
                    rx={8}
                    fill="#2b4f52"
                    stroke="#1c130f"
                    strokeWidth={3.2}
                  />
                  <path
                    d={`M ${x - 14} 206 h 28 a 9 9 0 0 1 9 9 v 5 a 4 4 0 0 1 -4 4 h -${i === 0 ? 40 : 38} a 4 4 0 0 1 -4 -4 v -5 a 9 9 0 0 1 9 -9 z`}
                    fill="url(#d-boot)"
                    stroke="#1c130f"
                    strokeWidth={3.2}
                    strokeLinejoin="round"
                  />
                </>
              )}
            </g>
          ))}
        </motion.g>

        {/* ── Torso ─────────────────────────────────────────────────────── */}
        <path
          d="M 62 128 C 58 150, 56 172, 62 188 C 74 196, 126 196, 138 188 C 144 172, 142 150, 138 128 Z"
          fill="url(#d-tunic)"
          stroke="#1c130f"
          strokeWidth={3.4}
          strokeLinejoin="round"
        />
        <rect x={58} y={166} width={84} height={13} rx={4} fill="#3b2a20" stroke="#1c130f" strokeWidth={3} />
        <rect x={90} y={164} width={20} height={17} rx={4} fill="url(#d-band)" stroke="#1c130f" strokeWidth={3} />

        {/* ── Arms ──────────────────────────────────────────────────────── */}
        <motion.g
          style={{ rotate: armRot, transformBox: "view-box", transformOrigin: "64px 138px" }}
        >
          {damage >= 12 ? (
            <g>
              {/* Left arm ends in a bandaged stump. Don't ask where the rest went. */}
              <path d="M 64 134 C 57 140, 53 148, 53 157" fill="none" stroke="#1c130f" strokeWidth={17} strokeLinecap="round" />
              <path d="M 64 134 C 57 140, 53 148, 53 157" fill="none" stroke="url(#d-tunic)" strokeWidth={11.5} strokeLinecap="round" />
              <circle cx={53} cy={159} r={9.5} fill="#f7efdd" stroke="#1c130f" strokeWidth={3} />
              <path d="M 45 155 l 17 3 M 45 162 l 16 -3" stroke="#d9c9a6" strokeWidth={2} strokeLinecap="round" />
              {damage >= 14 && <ellipse cx={53} cy={160} rx={6} ry={5} fill="#9e1a1a" opacity={0.82} />}
            </g>
          ) : (
            <>
              <path
                d="M 64 134 C 48 142, 40 156, 40 170"
                fill="none"
                stroke="#1c130f"
                strokeWidth={17}
                strokeLinecap="round"
              />
              <path
                d="M 64 134 C 48 142, 40 156, 40 170"
                fill="none"
                stroke="url(#d-tunic)"
                strokeWidth={11.5}
                strokeLinecap="round"
              />
              <circle cx={39} cy={175} r={11} fill="url(#d-skin)" stroke="#1c130f" strokeWidth={3.2} />
            </>
          )}
        </motion.g>
        <motion.g
          style={{ rotate: armRotMirror, transformBox: "view-box", transformOrigin: "136px 138px" }}
        >
          {damage >= 19 ? (
            <g>
              {/* The other arm goes too — a second stump. He's mostly torso now. */}
              <path d="M 136 134 C 143 140, 147 148, 147 157" fill="none" stroke="#1c130f" strokeWidth={17} strokeLinecap="round" />
              <path d="M 136 134 C 143 140, 147 148, 147 157" fill="none" stroke="url(#d-tunic)" strokeWidth={11.5} strokeLinecap="round" />
              <circle cx={147} cy={159} r={9.5} fill="#f7efdd" stroke="#1c130f" strokeWidth={3} />
              <path d="M 138 155 l 17 3 M 139 162 l 16 -3" stroke="#d9c9a6" strokeWidth={2} strokeLinecap="round" />
              {damage >= 22 && <ellipse cx={147} cy={160} rx={6} ry={5} fill="#9e1a1a" opacity={0.82} />}
            </g>
          ) : (
            <>
              <path d="M 136 134 C 152 142, 160 156, 160 170" fill="none" stroke="#1c130f" strokeWidth={17} strokeLinecap="round" />
              <path d="M 136 134 C 152 142, 160 156, 160 170" fill="none" stroke="url(#d-tunic)" strokeWidth={11.5} strokeLinecap="round" />
              {damage >= 10 ? (
                <g>
                  {/* Hand's gone; it's a hook now. He insists it's an upgrade. */}
                  <circle cx={161} cy={170} r={6.5} fill="#6b4a30" stroke="#1c130f" strokeWidth={3} />
                  {damage >= 14 && <ellipse cx={161} cy={170} rx={5} ry={3.6} fill="#a81c1c" opacity={0.85} />}
                  <path d="M 161 173 v 9 a 7 7 0 1 0 9 -3" fill="none" stroke="#c2ccd6" strokeWidth={5} strokeLinecap="round" />
                  <path d="M 161 173 v 9 a 7 7 0 1 0 9 -3" fill="none" stroke="#7c8896" strokeWidth={1.6} strokeLinecap="round" opacity={0.5} />
                </g>
              ) : (
                <circle cx={161} cy={175} r={11} fill="url(#d-skin)" stroke="#1c130f" strokeWidth={3.2} />
              )}
            </>
          )}
        </motion.g>

        {/* ── Head ──────────────────────────────────────────────────────── */}
        <ellipse cx={64} cy={92} rx={7.5} ry={10} fill="url(#d-skin)" stroke="#1c130f" strokeWidth={3.2} />
        <ellipse cx={136} cy={92} rx={7.5} ry={10} fill="url(#d-skin)" stroke="#1c130f" strokeWidth={3.2} />
        <ellipse cx={100} cy={88} rx={37} ry={34} fill="url(#d-skin)" stroke="#1c130f" strokeWidth={3.4} />

        {/* ── Beard (drawn over the jaw, swings on its own) ─────────────── */}
        <motion.g
          style={{ rotate: beardRot, transformBox: "view-box", transformOrigin: "100px 100px" }}
        >
          <path
            d="M 64 96 C 50 118, 48 152, 58 174 C 66 192, 80 202, 100 202 C 120 202, 134 192, 142 174 C 152 152, 150 118, 136 96 C 128 112, 116 120, 100 120 C 84 120, 72 112, 64 96 Z"
            fill="url(#d-beard)"
            stroke="#1c130f"
            strokeWidth={3.4}
            strokeLinejoin="round"
          />
          {/* Strand detail */}
          <path d="M 76 128 C 72 146, 74 168, 82 186" fill="none" stroke="#c3b393" strokeWidth={2.6} strokeLinecap="round" opacity={0.8} />
          <path d="M 124 128 C 128 146, 126 168, 118 186" fill="none" stroke="#c3b393" strokeWidth={2.6} strokeLinecap="round" opacity={0.8} />
          <path d="M 100 138 C 99 158, 100 180, 100 198" fill="none" stroke="#c3b393" strokeWidth={2.6} strokeLinecap="round" opacity={0.7} />

          {/* Braids with brass rings */}
          {[
            { x: 74, dir: -1 },
            { x: 126, dir: 1 },
          ].map(({ x, dir }) => (
            <g key={x}>
              <path
                d={`M ${x} 190 C ${x + dir * 4} 202, ${x - dir * 3} 210, ${x + dir * 2} 220`}
                fill="none"
                stroke="url(#d-beard)"
                strokeWidth={11}
                strokeLinecap="round"
              />
              <path
                d={`M ${x} 190 C ${x + dir * 4} 202, ${x - dir * 3} 210, ${x + dir * 2} 220`}
                fill="none"
                stroke="#1c130f"
                strokeWidth={2.6}
                strokeLinecap="round"
                opacity={0.28}
              />
              <rect x={x - 7} y={206} width={14} height={7} rx={3} fill="url(#d-band)" stroke="#1c130f" strokeWidth={2.4} />
            </g>
          ))}

          {/* Moustache sits on top of the beard mass */}
          <path
            d="M 100 108 C 88 104, 72 108, 66 120 C 74 126, 92 118, 100 112 C 108 118, 126 126, 134 120 C 128 108, 112 104, 100 108 Z"
            fill="url(#d-beard)"
            stroke="#1c130f"
            strokeWidth={3.2}
            strokeLinejoin="round"
          />
        </motion.g>

        {/* ── Face (over the beard so the mouth reads) ──────────────────── */}
        <ellipse cx={76} cy={96} rx={11} ry={7} fill="url(#d-cheek)" />
        <ellipse cx={124} cy={96} rx={11} ry={7} fill="url(#d-cheek)" />

        <Eyes state={eyes} />

        {/* Angry brows */}
        <path d="M 76 68 L 94 76" stroke="#7a5334" strokeWidth={7} strokeLinecap="round" fill="none" />
        <path d="M 124 68 L 106 76" stroke="#7a5334" strokeWidth={7} strokeLinecap="round" fill="none" />

        {/* Big bulbous nose, last so it sits proud of the face */}
        <ellipse cx={100} cy={97} rx={14} ry={12} fill="url(#d-nose)" stroke="#1c130f" strokeWidth={3.2} />
        <ellipse cx={95} cy={93} rx={4} ry={3} fill="#ffffff" opacity={0.35} />

        <Mouth mood={mood} damage={damage} />

        {/* ── Accumulated injuries ──────────────────────────────────────── */}
        {damage >= 1 && (
          <g opacity={0.95}>
            <rect x={112} y={64} width={20} height={9} rx={2} fill="#f5e6c8" stroke="#1c130f" strokeWidth={2.4} transform="rotate(-16 122 68)" />
            <rect x={119} y={57} width={7} height={23} rx={2} fill="#e8d6b2" stroke="#1c130f" strokeWidth={2} transform="rotate(-16 122 68)" />
          </g>
        )}
        {damage >= 2 && <ellipse cx={74} cy={92} rx={11} ry={8} fill="url(#d-bruise)" />}
        {damage >= 3 && (
          <path d="M 60 108 q 6 -5 12 0" fill="none" stroke="#a8452f" strokeWidth={2.6} strokeLinecap="round" />
        )}
        {damage >= 4 && (
          <g>
            <path
              d="M 63 74 C 74 62, 126 62, 137 74 L 133 84 C 122 74, 78 74, 67 84 Z"
              fill="#f7efdd"
              stroke="#1c130f"
              strokeWidth={3}
              strokeLinejoin="round"
            />
            <path d="M 63 74 L 137 74" stroke="#d9c9a6" strokeWidth={2} />
          </g>
        )}

        {/* Black eye — the first injury that reads from across the room. */}
        {damage >= 5 && (
          <g>
            <ellipse cx={86} cy={82} rx={13} ry={11} fill="url(#d-bruise)" />
            <path d="M 76 90 q 10 6 20 0" fill="none" stroke="#6b4fa8" strokeWidth={2.2} strokeLinecap="round" opacity={0.7} />
          </g>
        )}

        {/* Matching bruise on the other cheek, and one across the nose. */}
        {damage >= 6 && (
          <>
            <ellipse cx={126} cy={92} rx={10} ry={7.5} fill="url(#d-bruise)" />
            <g transform="rotate(12 100 97)">
              <rect x={86} y={93} width={28} height={9} rx={2} fill="#f5e6c8" stroke="#1c130f" strokeWidth={2.4} />
              <rect x={96} y={86} width={8} height={23} rx={2} fill="#e8d6b2" stroke="#1c130f" strokeWidth={2} />
            </g>
          </>
        )}

        {/* Hand wrapped — for as long as there's a hand to wrap. */}
        {damage >= 7 && damage < 10 && (
          <g>
            <circle cx={161} cy={175} r={12.5} fill="#f7efdd" stroke="#1c130f" strokeWidth={3} />
            <path d="M 151 170 L 171 178 M 151 178 L 171 170" stroke="#d9c9a6" strokeWidth={2.2} strokeLinecap="round" />
          </g>
        )}

        {/* Ear plastered, hat visibly stitched back together. */}
        {damage >= 8 && (
          <g>
            <rect x={56} y={87} width={16} height={8} rx={2} fill="#f5e6c8" stroke="#1c130f" strokeWidth={2.2} transform="rotate(-8 64 91)" />
            <path
              d="M 78 46 L 86 40 M 88 44 L 96 38 M 98 42 L 106 36"
              stroke="#1c130f"
              strokeWidth={2.6}
              strokeLinecap="round"
              opacity={0.75}
            />
          </g>
        )}

        {/* Lost the eye. The patch is the most dignified he's looked in weeks. */}
        {damage >= 9 && (
          <g>
            <path d="M 70 74 L 150 60" stroke="#1c130f" strokeWidth={4} strokeLinecap="round" opacity={0.85} />
            <ellipse cx={86} cy={82} rx={12.5} ry={11} fill="#17110d" stroke="#1c130f" strokeWidth={2.6} />
            <ellipse cx={82} cy={78} rx={3} ry={2} fill="#4a382b" opacity={0.6} />
          </g>
        )}

        {/* ── Blood. It starts, and then it does not stop. ───────────────── */}
        {/* First blood: split brow and a nosebleed that drips down the beard. */}
        {damage >= 13 && (
          <InjuryPop reduced={reducedMotion}>
            <path d="M 106 65 l 13 6" stroke="#7d1414" strokeWidth={4.5} strokeLinecap="round" />
            <path d="M 107 66 l 11 5" stroke="#e0352b" strokeWidth={1.8} strokeLinecap="round" />
            <path d="M 95 105 q 5 7 10 2" fill="none" stroke="#b21f1f" strokeWidth={3.4} strokeLinecap="round" />
            <BloodDrip x={97} y={108} delay={0.1} reduced={reducedMotion} />
            <BloodDrip x={103} y={109} delay={1.0} reduced={reducedMotion} />
          </InjuryPop>
        )}

        {/* The bandages soak through, and his lip splits. */}
        {damage >= 14 && (
          <InjuryPop reduced={reducedMotion}>
            <ellipse cx={64} cy={91} rx={5} ry={3.2} fill="#a81c1c" opacity={0.85} />
            <ellipse cx={122} cy={67} rx={5.5} ry={3.6} fill="#a81c1c" opacity={0.8} transform="rotate(-16 122 67)" />
            <path d="M 108 118 q 6 4 3 9" fill="none" stroke="#8f1414" strokeWidth={3.4} strokeLinecap="round" />
            <BloodDrip x={110} y={124} delay={0.5} reduced={reducedMotion} />
          </InjuryPop>
        )}

        {/* Cheeks gashed, beard staining, a pool forming underneath. */}
        {damage >= 15 && (
          <InjuryPop reduced={reducedMotion}>
            <path d="M 126 96 l 9 11" stroke="#8f1414" strokeWidth={3.6} strokeLinecap="round" />
            <path d="M 127 97 l 7 8" stroke="#e0352b" strokeWidth={1.5} strokeLinecap="round" />
            <path d="M 72 101 l -8 9" stroke="#8f1414" strokeWidth={3.4} strokeLinecap="round" />
            <path d="M 96 126 q -4 24 0 46" fill="none" stroke="#9e1a1a" strokeWidth={4} strokeLinecap="round" opacity={0.45} />
            <ellipse cx={104} cy={233} rx={30} ry={6} fill="#7d1414" opacity={0.8} />
            <ellipse cx={122} cy={231} rx={10} ry={3} fill="#9e1a1a" opacity={0.7} />
            <BloodDrip x={100} y={124} delay={0.3} reduced={reducedMotion} />
            <BloodDrip x={106} y={126} delay={1.2} reduced={reducedMotion} />
          </InjuryPop>
        )}

        {/* Maximum carnage: gauzed head, bleeding everywhere, a spreading pool. */}
        {damage >= 16 && (
          <InjuryPop reduced={reducedMotion}>
            <path d="M 62 70 Q 100 60 138 70 L 136 79 Q 100 69 64 79 Z" fill="#efe6d2" stroke="#1c130f" strokeWidth={2.4} opacity={0.96} />
            <ellipse cx={116} cy={74} rx={6.5} ry={4.2} fill="#b21f1f" opacity={0.9} />
            <ellipse cx={100} cy={235} rx={44} ry={8.5} fill="#6f1111" opacity={0.85} />
            <ellipse cx={80} cy={233} rx={12} ry={3.5} fill="#8f1414" opacity={0.7} />
            <BloodDrip x={68} y={94} delay={0.6} reduced={reducedMotion} />
            <BloodDrip x={138} y={96} delay={1.4} reduced={reducedMotion} />
            <BloodDrip x={100} y={110} delay={0.0} reduced={reducedMotion} />
          </InjuryPop>
        )}

        {/* ── Beyond a wreck ─────────────────────────────────────────────── */}
        {/* The other eye goes. He is now, formally, not looking. */}
        {damage >= 17 && (
          <InjuryPop reduced={reducedMotion}>
            <path d="M 130 60 L 62 76" stroke="#1c130f" strokeWidth={4} strokeLinecap="round" opacity={0.85} />
            <ellipse cx={114} cy={82} rx={12.5} ry={11} fill="#17110d" stroke="#1c130f" strokeWidth={2.6} />
            <ellipse cx={110} cy={78} rx={3} ry={2} fill="#4a382b" opacity={0.6} />
          </InjuryPop>
        )}

        {/* Teeth on the floor of the jar. He was rather attached to those. */}
        {damage >= 20 && (
          <InjuryPop reduced={reducedMotion}>
            <path d="M 92 124 q 8 6 16 0" fill="none" stroke="#8f1414" strokeWidth={3} strokeLinecap="round" />
            <rect x={88} y={226} width={5} height={6} rx={1} fill="#fdf6e6" stroke="#1c130f" strokeWidth={1.4} transform="rotate(18 90 229)" />
            <rect x={112} y={229} width={5} height={6} rx={1} fill="#fdf6e6" stroke="#1c130f" strokeWidth={1.4} transform="rotate(-12 114 232)" />
            <rect x={100} y={231} width={5} height={5} rx={1} fill="#f3e9d2" stroke="#1c130f" strokeWidth={1.3} />
          </InjuryPop>
        )}

        {/* Head wrapped like a relic. The nose refuses to be contained. */}
        {damage >= 21 && (
          <InjuryPop reduced={reducedMotion}>
            <path d="M 60 72 L 140 62" fill="none" stroke="#efe6d2" strokeWidth={9} strokeLinecap="round" />
            <path d="M 58 84 L 142 78" fill="none" stroke="#efe6d2" strokeWidth={9} strokeLinecap="round" />
            <path d="M 62 95 L 138 91" fill="none" stroke="#e7dcc4" strokeWidth={8} strokeLinecap="round" />
            <ellipse cx={126} cy={80} rx={5} ry={4} fill="#b21f1f" opacity={0.85} />
            <ellipse cx={74} cy={73} rx={4} ry={3} fill="#9e1a1a" opacity={0.8} />
          </InjuryPop>
        )}

        {/* Bound together at the middle, over everything, with visible stitches. */}
        {damage >= 22 && (
          <InjuryPop reduced={reducedMotion}>
            <path d="M 60 168 Q 100 176 140 168 L 140 181 Q 100 189 60 181 Z" fill="#e7dcc4" stroke="#1c130f" strokeWidth={2.4} opacity={0.96} />
            <ellipse cx={100} cy={175} rx={7} ry={4} fill="#9e1a1a" opacity={0.8} />
            {[74, 90, 106, 122].map((x) => (
              <path key={x} d={`M ${x - 4} 170 L ${x + 4} 180 M ${x - 4} 180 L ${x + 4} 170`} stroke="#1c130f" strokeWidth={2} strokeLinecap="round" opacity={0.7} />
            ))}
          </InjuryPop>
        )}

        {/* ── Hat, on top of everything, sliding down as he takes a beating ─ */}
        <motion.g
          style={{
            rotate: hatRot,
            y: hatDrop,
            transformBox: "view-box",
            transformOrigin: "100px 60px",
          }}
        >
          <path
            d="M 50 60 C 50 28, 72 8, 100 8 C 130 8, 154 30, 163 56 C 166 65, 158 73, 149 68 C 143 64, 139 59, 135 54 C 128 60, 110 64, 92 64 C 74 64, 58 63, 50 60 Z"
            fill="url(#d-hat)"
            stroke="#1c130f"
            strokeWidth={3.4}
            strokeLinejoin="round"
          />
          <path
            d="M 66 30 C 76 18, 96 14, 110 18"
            fill="none"
            stroke="#ffffff"
            strokeWidth={5}
            strokeLinecap="round"
            opacity={0.16}
          />
          <rect x={46} y={52} width={108} height={17} rx={8} fill="url(#d-band)" stroke="#1c130f" strokeWidth={3.4} />
          <circle cx={165} cy={70} r={10} fill="#f7efdd" stroke="#1c130f" strokeWidth={3.2} />
        </motion.g>

        {/* Tiers 23–25: the soul gives up and starts to leave. */}
        <Afterlife damage={damage} reduced={reducedMotion} />

        {showStars && <DizzyStars />}

        {/* Blood flies on impact once he's actually bleeding. Keyed so each
            glass hit replays the burst. */}
        {!reducedMotion && damage >= 13 && impactSeed > 0 && (
          <motion.g key={impactSeed}>
            {BLOOD_SPRAY.slice(0, Math.max(3, Math.round(impactForce * BLOOD_SPRAY.length))).map((d, k) => (
              <motion.circle
                key={k}
                cx={100}
                cy={104}
                r={d.r * (0.7 + impactForce * 0.6)}
                fill="#c11f1f"
                initial={{ x: 0, y: 0, opacity: 0.9 }}
                animate={{ x: d.x * (0.6 + impactForce * 0.8), y: d.y * (0.6 + impactForce * 0.8), opacity: 0 }}
                transition={{ duration: 0.4 + impactForce * 0.2, ease: "easeOut" }}
              />
            ))}
          </motion.g>
        )}
      </motion.g>
        </svg>
      </motion.div>
    </div>
  );
}

function Eyes({ state }: { state: "open" | "blink" | "squeezed" | "dead" | "dizzy" }) {
  if (state === "dead") {
    return (
      <g stroke="#1c130f" strokeWidth={4} strokeLinecap="round">
        <path d="M 80 76 L 92 88 M 92 76 L 80 88" />
        <path d="M 108 76 L 120 88 M 120 76 L 108 88" />
      </g>
    );
  }
  if (state === "blink" || state === "squeezed") {
    return (
      <g stroke="#1c130f" strokeWidth={4} strokeLinecap="round" fill="none">
        <path d={state === "squeezed" ? "M 79 84 q 7 -7 14 0" : "M 79 82 h 14"} />
        <path d={state === "squeezed" ? "M 107 84 q 7 -7 14 0" : "M 107 82 h 14"} />
      </g>
    );
  }
  if (state === "dizzy") {
    return (
      <g fill="none" stroke="#1c130f" strokeWidth={3}>
        <ellipse cx={86} cy={82} rx={8} ry={8.5} fill="#fffaf0" />
        <ellipse cx={114} cy={82} rx={8} ry={8.5} fill="#fffaf0" />
        <path d="M 86 82 m -4 0 a 4 4 0 1 1 4 4 a 2.5 2.5 0 1 0 -2.5 -2.5" strokeWidth={2.2} />
        <path d="M 114 82 m -4 0 a 4 4 0 1 1 4 4 a 2.5 2.5 0 1 0 -2.5 -2.5" strokeWidth={2.2} />
      </g>
    );
  }
  return (
    <g>
      <ellipse cx={86} cy={82} rx={8} ry={8.5} fill="#fffaf0" stroke="#1c130f" strokeWidth={3} />
      <ellipse cx={114} cy={82} rx={8} ry={8.5} fill="#fffaf0" stroke="#1c130f" strokeWidth={3} />
      <circle cx={87.5} cy={83} r={4} fill="#241a12" />
      <circle cx={115.5} cy={83} r={4} fill="#241a12" />
      <circle cx={89} cy={80.5} r={1.5} fill="#ffffff" />
      <circle cx={117} cy={80.5} r={1.5} fill="#ffffff" />
    </g>
  );
}

function Mouth({ mood, damage }: { mood: Mood; damage: number }) {
  if (mood === "shaking") {
    // Wide open, mid-yell.
    return (
      <g>
        <ellipse cx={100} cy={122} rx={13} ry={11} fill="#5b2320" stroke="#1c130f" strokeWidth={3} />
        <path d="M 90 118 h 20" stroke="#fffaf0" strokeWidth={4} strokeLinecap="round" />
        <ellipse cx={100} cy={130} rx={6} ry={4} fill="#c8564f" />
      </g>
    );
  }
  if (mood === "delivering") {
    return (
      <g>
        <path d="M 86 118 q 14 12 28 0 q -14 6 -28 0 Z" fill="#5b2320" stroke="#1c130f" strokeWidth={3} strokeLinejoin="round" />
        {damage < 3 && <rect x={94} y={118} width={6} height={5} fill="#fffaf0" />}
      </g>
    );
  }
  return <path d="M 88 122 q 12 -7 24 0" fill="none" stroke="#1c130f" strokeWidth={3.4} strokeLinecap="round" />;
}

const BLOOD_SPRAY = [
  { x: -34, y: -20, r: 3.0 },
  { x: 30, y: -26, r: 2.4 },
  { x: 40, y: 6, r: 2.8 },
  { x: -40, y: 10, r: 2.2 },
  { x: 22, y: 30, r: 3.2 },
  { x: -18, y: 34, r: 2.0 },
  { x: 8, y: -38, r: 2.2 },
  { x: -8, y: 40, r: 2.6 },
];

/** A single injury, sliding + fading in the moment it's earned. */
function InjuryPop({ children, reduced }: { children: ReactNode; reduced: boolean }) {
  if (reduced) return <g>{children}</g>;
  return (
    <motion.g
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 22 }}
    >
      {children}
    </motion.g>
  );
}

/** A bead of blood, welling and falling on a loop. */
function BloodDrip({ x, y, delay = 0, reduced }: { x: number; y: number; delay?: number; reduced: boolean }) {
  if (reduced) return <ellipse cx={x} cy={y + 7} rx={2.3} ry={3.4} fill="#a81c1c" />;
  return (
    <motion.ellipse
      cx={x}
      cy={y}
      rx={2.4}
      ry={3.6}
      fill="#b21f1f"
      initial={{ y: 0, opacity: 0 }}
      animate={{ y: [0, 22], opacity: [0, 1, 1, 0] }}
      transition={{ duration: 1.9, repeat: Infinity, delay, ease: "easeIn", times: [0, 0.12, 0.72, 1] }}
    />
  );
}

function Afterlife({ damage, reduced }: { damage: number; reduced: boolean }) {
  if (damage < 23) return null;
  const halo = damage >= 25 ? 1 : damage >= 24 ? 0.75 : 0.45;
  const ghost = damage >= 25 ? 0.6 : damage >= 24 ? 0.48 : 0.36;
  return (
    <g>
      {/* Halo, brightening as he lets go. */}
      <motion.ellipse
        cx={100}
        cy={7}
        rx={26}
        ry={6}
        fill="none"
        stroke="#ffe680"
        strokeWidth={4}
        style={{ opacity: halo }}
        animate={reduced ? undefined : { opacity: [halo * 0.6, halo, halo * 0.6] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* The ghost, bobbing free of the body. */}
      <motion.g
        animate={reduced ? undefined : { y: [0, -9, 0], opacity: [ghost * 0.7, ghost, ghost * 0.7] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
        style={{ opacity: ghost }}
      >
        <path
          d="M 100 34 C 84 34 79 48 79 62 L 79 84 q 6 -6 11 0 q 5 6 11 0 q 6 -6 11 0 L 121 62 C 121 48 116 34 100 34 Z"
          fill="#e6f4ff"
          stroke="#bcd8ea"
          strokeWidth={2}
        />
        <path d="M 91 55 l 6 6 m 0 -6 l -6 6" stroke="#5b6b78" strokeWidth={2} strokeLinecap="round" />
        <path d="M 103 55 l 6 6 m 0 -6 l -6 6" stroke="#5b6b78" strokeWidth={2} strokeLinecap="round" />
        <path d="M 94 72 q 6 5 12 0" fill="none" stroke="#5b6b78" strokeWidth={2} strokeLinecap="round" />
      </motion.g>
      {/* Flies, once it's properly over. */}
      {damage >= 24 &&
        [0, 1, 2].map((i) => (
          <motion.g
            key={i}
            animate={reduced ? undefined : { rotate: 360 }}
            transition={{ duration: 2.4 + i * 0.5, repeat: Infinity, ease: "linear" }}
            style={{ transformBox: "view-box", transformOrigin: "100px 54px" }}
          >
            <ellipse cx={100 + 30 - i * 4} cy={54 - i * 7} rx={2.1} ry={1.4} fill="#1c130f" />
          </motion.g>
        ))}
    </g>
  );
}

function DizzyStars() {
  return (
    <g>
      {[0, 1, 2].map((i) => (
        <motion.g
          key={i}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "linear", delay: i * 0.53 }}
          style={{ transformBox: "view-box", transformOrigin: "100px 30px" }}
        >
          <path
            d="M 100 8 l 3.4 6.9 l 7.6 1.1 l -5.5 5.4 l 1.3 7.6 l -6.8 -3.6 l -6.8 3.6 l 1.3 -7.6 l -5.5 -5.4 l 7.6 -1.1 Z"
            fill="#f7cf6b"
            stroke="#1c130f"
            strokeWidth={2.2}
            strokeLinejoin="round"
            transform="translate(0 -14)"
          />
        </motion.g>
      ))}
    </g>
  );
}

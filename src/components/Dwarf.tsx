"use client";

import { useEffect, useState } from "react";
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
  /** 0→5. Accumulated abuse; drives plasters, bruises and despair. */
  damage: number;
  mood: Mood;
  /** Bumped on every glass impact to fire the squash + flash. */
  impactSeed: number;
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
export function Dwarf({ intensity, damage, mood, impactSeed, reducedMotion }: DwarfProps) {
  const bodyX = useMotionValue(0);
  const bodyY = useMotionValue(0);
  const bodyRot = useMotionValue(0);
  const breathe = useMotionValue(1);

  // Squash-and-stretch, pulsed on impact.
  const squash = useSpring(0, { stiffness: 700, damping: 16, mass: 0.5 });

  useEffect(() => {
    if (impactSeed === 0 || reducedMotion) return;
    squash.set(1);
    const id = window.setTimeout(() => squash.set(0), 70);
    return () => window.clearTimeout(id);
  }, [impactSeed, squash, reducedMotion]);

  // ── Drive the body from shake energy ────────────────────────────────────
  useAnimationFrame((t) => {
    const i = reducedMotion ? 0 : intensity.get();
    const s = t / 1000;

    // Incommensurable frequencies => organic, never-repeating wobble.
    if (i > 0.002) {
      bodyX.set((Math.sin(s * 23.3) * 0.62 + Math.sin(s * 41.7 + 2.1) * 0.38) * 30 * i);
      bodyY.set((Math.sin(s * 19.1 + 1.3) * 0.6 + Math.sin(s * 37.3 + 0.4) * 0.4) * 20 * i);
      bodyRot.set((Math.sin(s * 15.7 + 0.7) * 0.7 + Math.sin(s * 31.1 + 1.9) * 0.3) * 26 * i);
    } else if (bodyX.get() !== 0) {
      bodyX.set(0);
      bodyY.set(0);
      bodyRot.set(0);
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
      </defs>

      {/* Everything hangs off this one group so the whole dwarf moves as a unit. */}
      <motion.g
        style={{
          x: bodyX,
          y: bodyY,
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
        </motion.g>
        <motion.g
          style={{ rotate: armRotMirror, transformBox: "view-box", transformOrigin: "136px 138px" }}
        >
          <path
            d="M 136 134 C 152 142, 160 156, 160 170"
            fill="none"
            stroke="#1c130f"
            strokeWidth={17}
            strokeLinecap="round"
          />
          <path
            d="M 136 134 C 152 142, 160 156, 160 170"
            fill="none"
            stroke="url(#d-tunic)"
            strokeWidth={11.5}
            strokeLinecap="round"
          />
          <circle cx={161} cy={175} r={11} fill="url(#d-skin)" stroke="#1c130f" strokeWidth={3.2} />
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

        {showStars && <DizzyStars />}
      </motion.g>
    </svg>
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

# Dobby

**Dobby** is a decision dwarf shake oracle built with React 19, Next.js 16, and Framer Motion. Shake your phone (or drag the chamber on desktop), and Dobby delivers a sarcastic answer from his glass chamber.

**Live demo:** https://dobby-eta.vercel.app

## Quick Start

```bash
npm install
npm run dev
# Visit http://localhost:3000
```

Grant motion sensor permission on iOS, then shake your device. On desktop, use the "Poke Dobby" button or drag the chamber to simulate shaking.

## Features

- **Articulated SVG Dwarf**: Hand-crafted with 8 independently spring-driven parts
- **Shake Detection**: DeviceMotion (iOS/Android) + pointer fallback (desktop)
- **100% Synthesized Audio**: WebAudio grunts, thuds, glass, and stings
- **63-Line Verdict Bank**: Weighted random sampling, refuses to repeat
- **Dark/Light Theme**: Respects system preferences and reduced-motion
- **Haptic Feedback**: Vibration on iOS and Android

## Tech Stack

- React 19 + Next.js 16 (Turbopack)
- TypeScript (strict mode)
- Framer Motion (spring physics)
- Tailwind CSS 4
- WebAudio API + DeviceMotion API

## Deployment

### Vercel

1. Create a Vercel account and link your GitHub repo
2. Set root directory to `.`

No environment variables are needed — Dobby is entirely self-contained.

## Architecture

- `src/app/page.tsx` — Main orchestrator (251 lines)
- `src/components/Dwarf.tsx` — Animated SVG (370 lines)
- `src/lib/useShake.ts` — Shake detection (230 lines)
- `src/lib/sound.ts` — WebAudio synthesis (180 lines)
- `src/lib/verdicts.ts` — Verdict bank (61 lines)
- `src/lib/speech.ts` — Verdict narration (Web Speech API)

## License

MIT

---

Built with [Claude Code](https://claude.ai/code).

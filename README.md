# Doddy

**Doddy** is a decision dwarf shake oracle built with React 19, Next.js 16, and Framer Motion. Shake your phone (or drag the chamber on desktop), and Doddy delivers a sarcastic answer from his glass chamber.

**Live demo:** https://dobby-eta.vercel.app

## Quick Start

```bash
npm install
npm run dev
# Visit http://localhost:3000
```

Grant motion sensor permission on iOS, then shake your device. On desktop, use the "Poke Doddy" button or drag the chamber to simulate shaking.

## Features

- **Articulated SVG Dwarf**: Hand-crafted with 8 independently spring-driven parts
- **Shake Detection**: DeviceMotion (iOS/Android) + pointer fallback (desktop)
- **100% Synthesized Audio**: WebAudio grunts, thuds, glass, and stings
- **63-Line Verdict Bank**: Weighted random sampling, refuses to repeat
- **Optional Supabase Persistence**: Works offline; DB is optional
- **Dark/Light Theme**: Respects system preferences and reduced-motion
- **Haptic Feedback**: Vibration on iOS and Android

## Tech Stack

- React 19 + Next.js 16 (Turbopack)
- TypeScript (strict mode)
- Framer Motion (spring physics)
- Tailwind CSS 4
- WebAudio API + DeviceMotion API
- Supabase (optional)

## Deployment

### Vercel

1. Create a Vercel account and link your GitHub repo
2. Set root directory to `.` (not a subdirectory since this is now the root)
3. Environment variables (optional):
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Service role key (server-only)

### Local Supabase (Optional)

```bash
supabase init
supabase start
# Apply migrations in supabase/migrations/
supabase migration run
```

## Architecture

- `src/app/page.tsx` — Main orchestrator (251 lines)
- `src/components/Dwarf.tsx` — Animated SVG (370 lines)
- `src/lib/useShake.ts` — Shake detection (230 lines)
- `src/lib/sound.ts` — WebAudio synthesis (180 lines)
- `src/lib/verdicts.ts` — Verdict bank (61 lines)
- `src/app/api/` — Optional persistence routes

## License

MIT

---

Built with [Claude Code](https://claude.ai/code).

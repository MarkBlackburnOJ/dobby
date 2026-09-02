/**
 * Dobby's verdict bank.
 *
 * This is the local fallback (and the seed data for Supabase). Dobby is a
 * unionised mine-dwarf who has been sealed in a glass chamber and is shaken
 * for answers by strangers. He resents this. He answers anyway.
 */

export type Tone = "yes" | "no" | "maybe" | "chaotic";

export interface Verdict {
  text: string;
  tone: Tone;
  /** Higher = shows up more often. Keeps the best lines in rotation. */
  weight?: number;
}

export const VERDICTS: Verdict[] = [
  // ── AYE ───────────────────────────────────────────────────────────────
  { text: "Aye. Now put me down.", tone: "yes", weight: 3 },
  { text: "Yes. Obviously yes. Was that worth a concussion?", tone: "yes", weight: 2 },
  { text: "Aye, do it. I've seen worse ideas. I've been worse ideas.", tone: "yes", weight: 2 },
  { text: "Yes — and I say that as a dwarf currently seeing four of you.", tone: "yes" },
  { text: "The runes say aye. The runes are also spinning. Mostly aye.", tone: "yes" },
  { text: "Go on then. Do it before I sober up and change my mind.", tone: "yes" },
  { text: "Aye. And when it works, you'll not thank me. They never do.", tone: "yes" },
  { text: "Yes. I'd stake my beard on it, and that beard is all I have left.", tone: "yes" },
  { text: "Absolutely. Commit to the bit.", tone: "yes", weight: 2 },
  { text: "Aye, lad. The mountain agrees. The mountain also wants you to stop.", tone: "yes" },
  { text: "Yes. I felt it in my knees, which is where I feel everything now.", tone: "yes" },
  { text: "That's a yes. Written in bruise, but a yes.", tone: "yes", weight: 2 },
  { text: "Do it. Worst case you end up in a jar like me.", tone: "yes" },
  { text: "Yes, and quickly, before someone sensible talks you out of it.", tone: "yes" },
  { text: "Aye. I'd have said so at a normal volume, mind.", tone: "yes" },
  { text: "Yes. The good kind of yes. Go.", tone: "yes" },

  // ── NAY ───────────────────────────────────────────────────────────────
  { text: "No. Next question. Gentler.", tone: "no", weight: 3 },
  { text: "Nope. And I'd have told you that without the whiplash.", tone: "no", weight: 2 },
  { text: "No. Absolutely not. Put the phone down and think about your life.", tone: "no", weight: 2 },
  { text: "No. The stones say no. My spine says no. It's unanimous.", tone: "no", weight: 2 },
  { text: "Under no circumstances. And I have agreed to some circumstances.", tone: "no" },
  { text: "No — and I'm being polite because there's children present.", tone: "no" },
  { text: "Hard no. Softer shake next time, aye?", tone: "no", weight: 2 },
  { text: "No. I've watched a hundred fools try that. I buried ninety.", tone: "no" },
  { text: "Absolutely not, and now my hat's inside out.", tone: "no" },
  { text: "No. Do the boring thing. The boring thing keeps you alive.", tone: "no", weight: 2 },
  { text: "No. And before you shake again — still no.", tone: "no", weight: 2 },
  { text: "That's a no from me and a no from the beard.", tone: "no" },
  { text: "No. You knew that. You just wanted a dwarf to say it.", tone: "no", weight: 2 },
  { text: "No, and I'd like it noted that I said so before the ceiling hit me.", tone: "no" },
  { text: "Nay. Not today, not next Tuesday, not ever.", tone: "no" },

  // ── HMMN ──────────────────────────────────────────────────────────────
  { text: "Hmmmn. Ask me again when I can see straight.", tone: "maybe", weight: 3 },
  { text: "Could go either way. Like me, just now.", tone: "maybe", weight: 2 },
  { text: "Maybe. The vision was interrupted by my head hitting glass.", tone: "maybe", weight: 2 },
  { text: "Fifty-fifty. Same odds I make it through today.", tone: "maybe" },
  { text: "Unclear. There's a fair bit of ringing in my ears.", tone: "maybe" },
  { text: "The omens are muddy. So am I. Related, probably.", tone: "maybe" },
  { text: "Possibly. Ask a better question and I'll give a better answer.", tone: "maybe", weight: 2 },
  { text: "Mmmaybe. Depends entirely on things you've not told me.", tone: "maybe", weight: 2 },
  { text: "The runes landed on their edge. That's your problem now.", tone: "maybe" },
  { text: "I want to say yes. My professional judgement says wait.", tone: "maybe", weight: 2 },
  { text: "Ask again in a week. I'll be no wiser, but you might be.", tone: "maybe" },
  { text: "It'll work. Not the way you're imagining, mind.", tone: "maybe", weight: 2 },
  { text: "Signs point to 'you already decided and want permission'.", tone: "maybe", weight: 2 },

  // ── CHAOS ─────────────────────────────────────────────────────────────
  { text: "I'm legally obliged to say 'consult a professional'. I am not one.", tone: "chaotic", weight: 2 },
  { text: "Wrong question. The real one's the one you're avoiding.", tone: "chaotic", weight: 3 },
  { text: "Sell everything. Move to the coast. Trust me, I'm a rock.", tone: "chaotic" },
  { text: "That's between you and whatever you did last Tuesday.", tone: "chaotic", weight: 2 },
  { text: "The answer is 'seven'. I don't make the rules. I just get shaken.", tone: "chaotic", weight: 2 },
  { text: "I saw your future. I'd like to un-see it, please.", tone: "chaotic", weight: 2 },
  { text: "Ask your mother. She already knows.", tone: "chaotic", weight: 2 },
  { text: "Yes, but not for the reason you think, and not with the person you think.", tone: "chaotic" },
  { text: "The spirits are on lunch. Try again in an hour.", tone: "chaotic" },
  { text: "I've been shaken so hard I've achieved enlightenment. It's overrated. Do it.", tone: "chaotic" },
  { text: "New rule: one more question, then I'm calling my union.", tone: "chaotic", weight: 2 },
  { text: "Do it, but badly, and on purpose. Deniability, lad.", tone: "chaotic" },
  { text: "You get the answer you deserve, and you shook me like that.", tone: "chaotic", weight: 2 },
  { text: "Everything is fine. That's not a prophecy, I'm just being kind.", tone: "chaotic" },
  { text: "The chamber has spoken. The chamber is a jar. Interpret freely.", tone: "chaotic" },
  { text: "I'd tell you, but you'd only shake me about it.", tone: "chaotic", weight: 2 },
];

/** Yelled mid-shake, in a speech bubble. Short. Loud. */
export const PROTESTS: string[] = [
  "OI—",
  "NOT THE BEARD",
  "MY BACK—",
  "I'LL REMEMBER THIS",
  "AAARGH",
  "ENOUGH—",
  "HR! HR!!",
  "THAT'S THE GLASS!",
  "WHY",
  "STOP—",
  "ME HAT!",
  "OOF",
  "I HAVE A FAMILY",
];

/** Muttered while idle, waiting for a question. */
export const IDLE_MUTTERS: string[] = [
  "Well? Ask, then.",
  "I've all day. I've literally nothing else.",
  "Don't just stare at me.",
  "Ask. Shake. Gently, mind.",
  "Another one. Marvellous.",
  "Go on. Get it over with.",
];

export const TONE_META: Record<Tone, { label: string; accent: string; glow: string }> = {
  yes: { label: "AYE", accent: "#5fd6a0", glow: "rgba(95,214,160,.45)" },
  no: { label: "NAY", accent: "#ff6b6b", glow: "rgba(255,107,107,.45)" },
  maybe: { label: "HMMN", accent: "#f5c451", glow: "rgba(245,196,81,.45)" },
  chaotic: { label: "???", accent: "#c08bff", glow: "rgba(192,139,255,.45)" },
};

/**
 * Weighted pick that refuses to repeat anything in `recent`.
 * Falls back to the unfiltered pool if the caller has exhausted the bank.
 */
export function pickVerdict(pool: Verdict[] = VERDICTS, recent: string[] = []): Verdict {
  const fresh = pool.filter((v) => !recent.includes(v.text));
  const candidates = fresh.length > 0 ? fresh : pool;

  const total = candidates.reduce((sum, v) => sum + (v.weight ?? 1), 0);
  let roll = Math.random() * total;
  for (const v of candidates) {
    roll -= v.weight ?? 1;
    if (roll <= 0) return v;
  }
  return candidates[candidates.length - 1];
}

export function pickOne<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

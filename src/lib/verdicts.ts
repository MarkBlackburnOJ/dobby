/**
 * Dobby's verdict bank.
 *
 * Dobby is a
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

    { text: "Aye. Don't make me say it twice, my jaw's loose.", tone: "yes", weight: 2 },
  { text: "Yes. And I've said yes to worse from inside this jar.", tone: "yes" },
  { text: "Go. Before the sensible part of you wakes up.", tone: "yes", weight: 2 },
  { text: "Aye. The mountain's been wrong before, but not about this.", tone: "yes" },
  { text: "Yes. Write it down so you can't blame me later.", tone: "yes" },
  { text: "Aye, and I'd do it myself if I had the room to stand.", tone: "yes" },
  { text: "That's a yes. My knees agreed before I did.", tone: "yes" },
  { text: "Yes. There. Now let a man settle.", tone: "yes", weight: 2 },
  { text: "Aye. It's not clever, but it's right, and those aren't the same.", tone: "yes" },
  { text: "Do it. Worst case you end up in a jar like me.", tone: "yes", weight: 2 },
  { text: "Aye. I've consulted the runes, the ale, and my ruined spine. Unanimous.", tone: "yes" },
  { text: "Yes. You knew that. You just wanted a dwarf to say it.", tone: "yes", weight: 3 },
  { text: "Aye, go on. Somebody in this jar should have a life.", tone: "yes" },
  { text: "Yes. I'd shake on it, but you've done enough shaking.", tone: "yes", weight: 2 },

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

    { text: "No. And stop looking at me like that.", tone: "no", weight: 2 },
  { text: "Nay. Not today, not with those shoulders.", tone: "no" },
  { text: "No. I've seen how this ends and I was there for it.", tone: "no", weight: 2 },
  { text: "Nay. Put it down. Walk away. Buy a pie.", tone: "no", weight: 2 },
  { text: "No. That's not pessimism, that's forty years underground.", tone: "no" },
  { text: "Nay. The answer was no before you picked me up.", tone: "no" },
  { text: "No. And I resent being shaken to say something so obvious.", tone: "no" },
  { text: "Nay, lad. Some holes you don't dig deeper.", tone: "no", weight: 3 },
  { text: "No. Ask me again in a year, when you've grown out of it.", tone: "no" },
  { text: "No. Frankly the question's insulting, and so is the shaking.", tone: "no" },
  { text: "Nay. Everything in me says no, and most of me is bruise.", tone: "no", weight: 2 },
  { text: "No. Take the loss now, it's cheaper.", tone: "no" },
  { text: "Nay. I'm not paid enough for this. I'm not paid at all.", tone: "no", weight: 2 },
  { text: "No. Absolutely not. Next.", tone: "no" },

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

    { text: "Hmm. Ask me when you've decided what you actually want.", tone: "maybe", weight: 2 },
  { text: "Maybe. The runes are being coy, and so am I.", tone: "maybe" },
  { text: "Could go either way. Most things do.", tone: "maybe" },
  { text: "Mmm. That depends on a thing you haven't told me.", tone: "maybe", weight: 2 },
  { text: "Perhaps. I've been wrong about perhaps before.", tone: "maybe" },
  { text: "Half yes. Pick which half and get back to me.", tone: "maybe" },
  { text: "Possibly. I'd want a proper look, and I can't turn round.", tone: "maybe" },
  { text: "Hmm. There's a version of this that works. Not this version.", tone: "maybe", weight: 2 },
  { text: "Maybe. Come back with a better question and a softer grip.", tone: "maybe", weight: 2 },
  { text: "It's a shrug, lad. A dwarf-shaped shrug.", tone: "maybe", weight: 3 },
  { text: "Depends. On you, mostly. Sorry about that.", tone: "maybe" },
  { text: "Mmm. I'd say wait, but you never do.", tone: "maybe" },
  { text: "Perhaps. The mountain hasn't made its mind up either.", tone: "maybe" },
  { text: "Hmm. I'd need to see the paperwork, and there isn't any.", tone: "maybe", weight: 2 },

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
  { text: "The jar says yes. The jar is a jar. Proceed accordingly.", tone: "chaotic", weight: 2 },
  { text: "Seventeen. That's not an answer. It's all I have.", tone: "chaotic" },
  { text: "Ask the sea. It's got more time than me.", tone: "chaotic" },
  { text: "Yes, but only on a Tuesday, and only if nobody's watching.", tone: "chaotic", weight: 2 },
  { text: "I've forgotten the question. I remember the shaking.", tone: "chaotic", weight: 3 },
  { text: "The runes spelled out a rude word. Take from that what you will.", tone: "chaotic", weight: 2 },
  { text: "Do the opposite of whatever you were going to do. Report back.", tone: "chaotic" },
  { text: "That's between you and whatever's under the floorboards.", tone: "chaotic" },
  { text: "Signs point to a lie down.", tone: "chaotic", weight: 2 },
  { text: "I'd tell you, but the union advises against it.", tone: "chaotic", weight: 2 },
  { text: "The beard knows. The beard isn't talking.", tone: "chaotic" },
  { text: "Yes. No. Both. Neither. I've been shaken, not consulted.", tone: "chaotic", weight: 2 },
  { text: "There's a right answer and I've dropped it somewhere in here.", tone: "chaotic" },
  { text: "Flip a coin. If you're upset with the result, there's your answer.", tone: "chaotic", weight: 3 },
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
  "NOT AGAIN",
  "MIND THE HAT",
  "PUT ME DOWN",
  "MY KNEES",
  "THE GLASS! THE GLASS!",
  "UNION!",
  "I FELT THAT",
  "STEADY ON",
  "I'M DIZZY",
  "AGH—",
];

/** Muttered while idle, waiting for a question. */
export const IDLE_MUTTERS: string[] = [
  "Well? Ask, then.",
  "I've all day. I've literally nothing else.",
  "Don't just stare at me.",
  "Ask. Shake. Gently, mind.",
  "Another one. Marvellous.",
  "Go on. Get it over with.",
  "Right. Ask your question.",
  "Some of us are trying to work.",
  "I can hear you thinking.",
  "Take your time. I'm not going anywhere.",
  "It's a jar. I live in a jar.",
  "Ask, or put me down.",
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

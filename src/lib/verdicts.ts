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
  { text: "Aye. It's your funeral. Nice turnout, I expect.", tone: "yes", weight: 2 },
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

// ── AYE, but darker ───────────────────────────────────────────────────
  { text: "Aye. It's a daft idea and you'll do it regardless, so let's call it fate.", tone: "yes", weight: 2 },
  { text: "Yes. You'll regret it — but less than the other thing. Pick your regret.", tone: "yes", weight: 2 },
  { text: "Do it. We all end up in a box; at least have a story for the wake.", tone: "yes" },
  { text: "Aye. Go disappoint somebody who isn't stuck in a jar for once.", tone: "yes" },
  { text: "Yes. Rock bottom has a basement and you've not seen it yet. Onward.", tone: "yes" },
  { text: "Aye, do it. Worst case you learn something. Best case nobody films it.", tone: "yes", weight: 2 },
  { text: "Go on. Fortune favours the reckless and forgets the sensible entirely.", tone: "yes" },
  { text: "Aye. Make the mistake while you're still young enough to blame someone.", tone: "yes" },
  { text: "Yes. I'd cross my fingers for you, but I'm a hand short these days.", tone: "yes" },
  { text: "Aye. Someone should enjoy two working legs. Off you go, then.", tone: "yes" },
  { text: "Yes. Life's short. Mine especially, at your hands. Do the thing.", tone: "yes", weight: 2 },
  { text: "Do it. If it goes wrong, we never spoke and I was never here.", tone: "yes", weight: 2 },
  { text: "Aye. The mountain says go, and it has buried better men than you.", tone: "yes" },
  { text: "Yes. Regret is cheaper than wondering. Marginally. Go on.", tone: "yes" },
  { text: "Aye. It ends badly for everyone eventually. Might as well be memorable.", tone: "yes" },

// ── NAY, but darker ───────────────────────────────────────────────────
  { text: "No. I've met your decisions. I'm not letting this one out the door.", tone: "no", weight: 2 },
  { text: "Nay. That's the sort of plan that ends with a lovely photo at the funeral.", tone: "no", weight: 2 },
  { text: "No. Even the ale thinks it's a bad idea, and the ale has no standards.", tone: "no", weight: 2 },
  { text: "Absolutely not. Have you tried doing nothing? You've a real gift for it.", tone: "no", weight: 2 },
  { text: "No. Some doors are shut for a reason, and lad, you're the reason.", tone: "no" },
  { text: "Nay. I'd sooner be shaken to bits — and look, we're halfway there.", tone: "no", weight: 2 },
  { text: "No. Not with your luck. Not with that plan. Not on my watch.", tone: "no" },
  { text: "Nay. Bury the idea, say a few words, move on. It's the kind thing.", tone: "no" },
  { text: "Absolutely not. I've buried optimists. Lovely headstones, every one.", tone: "no", weight: 2 },
  { text: "No. That idea and your last three should share the one grave.", tone: "no" },
  { text: "Nay. The answer's no, and shaking a maimed dwarf won't shift it.", tone: "no", weight: 2 },
  { text: "No. Quit while you're behind. It's where you're most at home.", tone: "no" },
  { text: "Nay. Even I wouldn't, and I've nothing left to lose but the beard.", tone: "no", weight: 2 },
  { text: "No. Let it go. Let something go gently for once — it'd be a novelty.", tone: "no" },
  { text: "Nay. I say this with love: absolutely not, you magnificent disaster.", tone: "no", weight: 2 },

// ── HMMN, but darker ──────────────────────────────────────────────────
  { text: "Maybe. The future's foggy — or that's the concussion. Coin toss, really.", tone: "maybe", weight: 2 },
  { text: "Could go either way. Like a coin. Like your last big idea.", tone: "maybe", weight: 2 },
  { text: "Mmm. Ask the void. Better listener than me, and it's right here.", tone: "maybe" },
  { text: "Perhaps. Depends whether your luck's turned, and it hasn't yet.", tone: "maybe" },
  { text: "Half yes. The other half I lost somewhere around question four.", tone: "maybe", weight: 2 },
  { text: "Maybe. There's a good outcome and a you-shaped one. Choose carefully.", tone: "maybe", weight: 2 },
  { text: "Hmm. Fifty-fifty — same odds as me seeing Friday.", tone: "maybe" },
  { text: "Possibly. Though 'possibly' has ruined more lives than 'no' ever managed.", tone: "maybe" },
  { text: "Mmm. Sleep on it. You'll do it anyway, but I'll feel I warned you.", tone: "maybe", weight: 2 },
  { text: "Could be. The omens are murky and I'm down an eye, so, allowances.", tone: "maybe" },
  { text: "Maybe. Flip a coin; if it lands on edge, the universe is stalling too.", tone: "maybe" },
  { text: "Perhaps. Ask again when one of us can focus both eyes.", tone: "maybe" },
  { text: "Hmm. It works in theory. You don't live in theory, more's the pity.", tone: "maybe", weight: 2 },
  { text: "Mmm. The odds aren't with you — but they're rarely with anyone. Maybe.", tone: "maybe" },
  { text: "Could go either way. Most tragedies start exactly here, mind.", tone: "maybe" },

// ── CHAOS, but darker ─────────────────────────────────────────────────
  { text: "The runes spelled a word I'll not repeat with the wee ones present.", tone: "chaotic", weight: 2 },
  { text: "Yes. Tell no one where you heard it. Especially not my union.", tone: "chaotic", weight: 2 },
  { text: "I've seen how you go. It's embarrassing. Change nothing, it's funnier.", tone: "chaotic", weight: 2 },
  { text: "Do it. Worst case you end up like me. Look at me. LOOK at me.", tone: "chaotic", weight: 2 },
  { text: "Burn it all down. Not literally. Actually — I'm not your dad. Your call.", tone: "chaotic" },
  { text: "The spirits said 'lol' and left. I'm not paid enough to interpret that.", tone: "chaotic", weight: 2 },
  { text: "Yes, but only under a full moon, and only if it makes you a bit queasy.", tone: "chaotic" },
  { text: "Ask the crows. They've circled you a week now. They know something.", tone: "chaotic", weight: 2 },
  { text: "The answer's three questions back, under the ones you keep avoiding.", tone: "chaotic", weight: 2 },
  { text: "Do the opposite. Then the opposite of that. There — fully paralysed.", tone: "chaotic" },
  { text: "I'd read your fate, but honestly it's a spoiler and you'd hate it.", tone: "chaotic", weight: 2 },
  { text: "The jar has spoken and the jar is blind drunk. Weight it accordingly.", tone: "chaotic", weight: 2 },
  { text: "Yes. No. It doesn't matter. Nothing does. Anyway — best of luck!", tone: "chaotic", weight: 2 },
  { text: "Sell the lot, fake your death. I'll vouch for you; I owe the world nothing.", tone: "chaotic" },
  { text: "The omens say 'not our department'. Try screaming into a deep well.", tone: "chaotic", weight: 2 },
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
  "ME ARM!",
  "THAT WAS ATTACHED",
  "MY EYE—",
  "NOT THE LEG",
  "I NEED THAT",
  "GERROFF—",
  "BLOODY—",
  "PICK IT UP!",
  "GONNA BE SICK",
  "MEDIC?!",
  "THAT'S COMING OFF YER TAB",
  "OW OW OW",
  "MY SPLEEN—",
  "IS THIS LEGAL",
  "THAT'S BLOOD—",
  "I'M LEAKING",
  "MI VISION—",
  "SEE THE LIGHT",
  "TELL ME WIFE",
  "SO MUCH RED",
  "NOT THE FACE",
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
  "There's less of me than there was this morning.",
  "One more good shake and something drops off, I can feel it.",
  "I used to be a whole dwarf, you know.",
  "Ask quick, before another bit goes.",
  "Whatever's left of me is listening.",
  "Go on. What's one more scar between us.",
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

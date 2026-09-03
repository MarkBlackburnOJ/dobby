"use client";

/**
 * Dobby says his verdicts out loud.
 *
 * Same principle as the rest of the audio in here: nothing ships as a binary,
 * the browser makes the noise. Voice quality varies wildly by platform, so we
 * hunt for the gruffest English voice on offer and drop the pitch until it
 * lands somewhere near "small furious man sealed in a jar".
 */

const SPEECH_KEY = "dobby:speech";

/** How a single line should sound, coloured to the dwarf saying it. */
export interface VoiceOpts {
  pitch?: number;
  rate?: number;
  /**
   * Preferred voice names, best first. Lets each dwarf claim a different voice
   * when the device offers more than one, instead of three pitches of the same.
   */
  prefer?: string[];
}

/**
 * The good variants modern phones ship — and, on iOS, a free download under
 * Settings › Accessibility › Spoken Content › Voices. These are the difference
 * between "robot reading" and "bloke in a jar", so we hunt for them hard.
 */
const QUALITY = /enhanced|premium|neural|natural/;
/** Gruff English voices that ship somewhere by default, worth a nudge. */
const GRUFF = /\b(daniel|arthur|oliver|george|graham|reed|rishi|aaron|rocko)\b/;

class DobbySpeech {
  /** Best voice found per preference key — one resolution per dwarf, then cached. */
  private picks = new Map<string, SpeechSynthesisVoice>();
  private primed = false;
  enabled = true;

  constructor() {
    if (typeof window === "undefined") return;
    try {
      this.enabled = window.localStorage.getItem(SPEECH_KEY) !== "0";
    } catch {
      this.enabled = true;
    }
    // getVoices() is empty until the engine loads them and often fills in a beat
    // later. When the full list lands, drop our picks so the next line resolves
    // against the good voices rather than whatever was ready first.
    try {
      window.speechSynthesis?.addEventListener?.("voiceschanged", () => this.picks.clear());
    } catch {
      /* no speechSynthesis on this device — say() will simply no-op */
    }
  }

  get supported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  setEnabled(next: boolean) {
    this.enabled = next;
    if (!next) this.stop();
    try {
      window.localStorage.setItem(SPEECH_KEY, next ? "1" : "0");
    } catch {
      /* private browsing — the preference simply won't persist */
    }
  }

  /**
   * iOS refuses to speak unless the first utterance happens inside a user
   * gesture, and our real utterance is deliberately delayed so it doesn't
   * collide with the verdict sting. So we burn a silent one on the gesture to
   * open the gate. Call this wherever audio.unlock() is called.
   */
  unlock() {
    if (!this.supported || this.primed) return;
    this.primed = true;
    try {
      const u = new SpeechSynthesisUtterance(" ");
      u.volume = 0;
      window.speechSynthesis.speak(u);
    } catch {
      /* nothing to do — say() will just be a no-op on this device */
    }
  }

  /** Rank a voice for "gruff British man sealed in a jar", boosting the good stuff. */
  private score(v: SpeechSynthesisVoice, prefer: string[]): number {
    const name = v.name.toLowerCase();
    const lang = v.lang.toLowerCase();
    let s = 0;
    // This dwarf's own pick wins decisively, so the three stay distinct when the
    // device has the voices to spare.
    prefer.forEach((want, i) => {
      if (name.includes(want)) s += 120 - i * 12;
    });
    if (QUALITY.test(name)) s += 55; // enhanced / neural — the whole point
    if (name.includes("siri")) s += 34;
    if (name.includes("google uk english male")) s += 36;
    if (GRUFF.test(name)) s += 28;
    if (name.includes("male")) s += 12;
    if (lang.startsWith("en-gb")) s += 22; // British first…
    else if (lang.startsWith("en")) s += 8; // …then any English
    if (v.default) s += 2;
    return s;
  }

  /**
   * Best available voice for a set of name hints. getVoices() is empty until the
   * engine loads them (hence the voiceschanged handler above), so this is safe
   * to run more than once; each preference key resolves once and is then cached.
   */
  private resolveVoice(prefer: string[] = []): SpeechSynthesisVoice | null {
    if (!this.supported) return null;

    const key = prefer.join("|");
    const cached = this.picks.get(key);
    if (cached) return cached;

    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;

    const english = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
    const pool = english.length ? english : voices;

    let best: SpeechSynthesisVoice | null = null;
    let bestScore = -Infinity;
    for (const v of pool) {
      const sc = this.score(v, prefer);
      if (sc > bestScore) {
        bestScore = sc;
        best = v;
      }
    }

    if (best) this.picks.set(key, best);
    return best;
  }

  stop() {
    if (!this.supported) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* no-op */
    }
  }

  /** Deliver a line, coloured to the speaking dwarf. Cancels anything mid-mouth. */
  say(text: string, voiceOpts?: VoiceOpts) {
    if (!this.supported || !this.enabled) return;

    this.stop();

    const utter = new SpeechSynthesisUtterance(text);
    const voice = this.resolveVoice(voiceOpts?.prefer);
    if (voice) {
      utter.voice = voice;
      utter.lang = voice.lang;
    }
    // Each dwarf has its own register; default is low and unhurried.
    utter.pitch = voiceOpts?.pitch ?? 0.7;
    utter.rate = voiceOpts?.rate ?? 0.95;
    utter.volume = 1;

    try {
      window.speechSynthesis.speak(utter);
    } catch {
      /* some engines throw when the queue is in a bad state; not worth surfacing */
    }
  }
}

export const speech = new DobbySpeech();

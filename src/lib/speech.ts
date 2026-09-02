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

/**
 * Voices worth having, best first, matched loosely against name and lang.
 * Daniel is the stock UK male on Apple platforms and is by far the closest
 * thing to a put-upon dwarf that ships by default anywhere.
 */
const PREFERRED = [
  "daniel",
  "arthur",
  "oliver",
  "google uk english male",
  "en-gb",
];

class DobbySpeech {
  private voice: SpeechSynthesisVoice | null = null;
  private primed = false;
  enabled = true;

  constructor() {
    if (typeof window === "undefined") return;
    try {
      this.enabled = window.localStorage.getItem(SPEECH_KEY) !== "0";
    } catch {
      this.enabled = true;
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

  /**
   * getVoices() is empty until the engine has loaded them, and on some
   * browsers only populates after the first call, so this is safe (and
   * expected) to run more than once.
   */
  private resolveVoice(): SpeechSynthesisVoice | null {
    if (this.voice) return this.voice;
    if (!this.supported) return null;

    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;

    const english = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
    const pool = english.length ? english : voices;

    for (const want of PREFERRED) {
      const hit = pool.find(
        (v) => v.name.toLowerCase().includes(want) || v.lang.toLowerCase().includes(want),
      );
      if (hit) {
        this.voice = hit;
        return hit;
      }
    }

    this.voice = pool.find((v) => v.lang.toLowerCase().startsWith("en-gb")) ?? pool[0];
    return this.voice;
  }

  stop() {
    if (!this.supported) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* no-op */
    }
  }

  /** Deliver a line. Cancels anything already in Dobby's mouth. */
  say(text: string) {
    if (!this.supported || !this.enabled) return;

    this.stop();

    const utter = new SpeechSynthesisUtterance(text);
    const voice = this.resolveVoice();
    if (voice) {
      utter.voice = voice;
      utter.lang = voice.lang;
    }
    // Low and unhurried: he is not pleased to be doing this.
    utter.pitch = 0.7;
    utter.rate = 0.95;
    utter.volume = 1;

    try {
      window.speechSynthesis.speak(utter);
    } catch {
      /* some engines throw when the queue is in a bad state; not worth surfacing */
    }
  }
}

export const speech = new DobbySpeech();

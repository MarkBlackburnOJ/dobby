"use client";

/**
 * Dobby says his verdicts out loud.
 *
 * Two paths. Verdicts prefer a cloud voice — a real, non-robotic AWS Polly voice
 * per dwarf, fetched key-lessly from a public endpoint — and quietly fall back to
 * the on-device synth when it can't be reached. Everything else (the rapid-fire
 * curses) stays on-device for zero latency. On-device, voice quality varies
 * wildly by platform, so we score what's installed and grab the best — favouring
 * the enhanced/neural variants that land somewhere near "small furious man in a jar".
 */

const SPEECH_KEY = "dobby:speech";

/** How a single line should sound, coloured to the dwarf saying it. */
export interface VoiceOpts {
  pitch?: number;
  rate?: number;
  /**
   * Preferred on-device voice names, best first. Lets each dwarf claim a
   * different voice when the device offers more than one, instead of three
   * pitches of the same. Also the fallback when the cloud voice can't be reached.
   */
  prefer?: string[];
  /**
   * An AWS Polly voice name (e.g. "Brian"). When set, the line is fetched from
   * the cloud endpoint below — a real, non-robotic voice — and only falls back
   * to the on-device synth if that can't be reached.
   */
  cloud?: string;
}

/**
 * Free, key-less text-to-speech: StreamElements fronts AWS Polly and returns an
 * MP3 for a voice + line. It's an unofficial endpoint — it can rate-limit or
 * change — so every use degrades gracefully to the on-device voice, and only
 * the short verdict goes through it (never the rapid-fire curses).
 */
const cloudTts = (voice: string, text: string) =>
  `https://api.streamelements.com/kappa/v2/speech?voice=${encodeURIComponent(voice)}` +
  `&text=${encodeURIComponent(text.slice(0, 280))}`;

/** A sliver of silence, built at runtime, used to bless the <audio> element
 *  inside a user gesture so a later programmatic play() isn't blocked on iOS. */
function silentClip(): string {
  const n = 8; // a handful of 8-bit PCM samples @ 8kHz — enough to open the gate
  const bytes = new Uint8Array(44 + n);
  const view = new DataView(bytes.buffer);
  const tag = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
  };
  tag(0, "RIFF");
  view.setUint32(4, 36 + n, true);
  tag(8, "WAVE");
  tag(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, 8000, true);
  view.setUint32(28, 8000, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  tag(36, "data");
  view.setUint32(40, n, true);
  for (let i = 0; i < n; i++) bytes[44 + i] = 128; // 8-bit silence sits at 128
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return "data:audio/wav;base64," + btoa(bin);
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
  /** One reused <audio> for the cloud voice, and whether a gesture has blessed it. */
  private cloudAudio: HTMLAudioElement | null = null;
  private cloudPrimed = false;
  /** After a couple of failures we stop reaching for the cloud this session, so a
   *  dead or slow endpoint doesn't tax every verdict with a doomed request first. */
  private cloudFails = 0;
  private cloudBroken = false;
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
    if (typeof window === "undefined") return;

    // Bless the cloud <audio> element on the gesture, so a verdict fetched a
    // beat later can still play on iOS. Runs once; harmless if there's no cloud.
    if (!this.cloudPrimed) {
      this.cloudPrimed = true;
      try {
        const el = this.ensureCloudAudio();
        if (el) {
          el.src = silentClip();
          el.muted = true;
          const p = el.play();
          if (p) p.then(() => el.pause()).catch(() => {});
        }
      } catch {
        /* element couldn't be primed — the cloud path will fall back to synth */
      }
    }

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

  private ensureCloudAudio(): HTMLAudioElement | null {
    if (typeof window === "undefined" || typeof Audio === "undefined") return null;
    if (!this.cloudAudio) {
      this.cloudAudio = new Audio();
      this.cloudAudio.preload = "auto";
    }
    return this.cloudAudio;
  }

  /**
   * Speak one line through the cloud voice. Returns false if it can't even try
   * (not blessed yet, no Audio); on a network/endpoint error mid-flight it
   * quietly hands off to the on-device voice so the line is never simply lost.
   */
  private cloudSay(text: string, voice: string, opts: VoiceOpts): boolean {
    const el = this.ensureCloudAudio();
    if (!el || !this.cloudPrimed || this.cloudBroken) return false;

    let handed = false;
    const fallback = () => {
      if (handed) return;
      handed = true;
      el.onerror = null;
      if (++this.cloudFails >= 2) this.cloudBroken = true;
      this.localSay(text, opts);
    };

    el.onerror = fallback;
    el.muted = false;
    el.volume = 1;
    el.src = cloudTts(voice, text);
    try {
      const p = el.play();
      if (p) p.catch(() => fallback());
    } catch {
      fallback();
    }
    return true;
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
    if (this.supported) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* no-op */
      }
    }
    if (this.cloudAudio) {
      try {
        this.cloudAudio.pause();
      } catch {
        /* no-op */
      }
    }
  }

  /**
   * Deliver a line, coloured to the speaking dwarf. Cancels anything mid-mouth.
   * Uses the cloud voice when one is asked for and reachable, else the best
   * voice on the device.
   */
  say(text: string, voiceOpts?: VoiceOpts) {
    if (!this.enabled) return;
    this.stop();

    if (voiceOpts?.cloud && this.cloudSay(text, voiceOpts.cloud, voiceOpts)) return;
    this.localSay(text, voiceOpts);
  }

  /** The on-device path: the browser's own synth, best voice we can find. */
  private localSay(text: string, voiceOpts?: VoiceOpts) {
    if (!this.supported) return;

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

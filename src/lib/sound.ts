"use client";

/**
 * Every sound in Dobby is synthesized at runtime — there are no audio files in
 * this repo. Grunts are a sawtooth glide pushed through two formant bandpasses,
 * which is a cheap but convincing "uh!" from a small angry man.
 */

type ToneName = "yes" | "no" | "maybe" | "chaotic";

const MUTE_KEY = "dobby:muted";

class DobbyAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  muted = false;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        this.muted = window.localStorage.getItem(MUTE_KEY) === "1";
      } catch {
        this.muted = false;
      }
    }
  }

  /** Must be called from a user gesture or browsers keep the context suspended. */
  unlock() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  setMuted(next: boolean) {
    this.muted = next;
    try {
      window.localStorage.setItem(MUTE_KEY, next ? "1" : "0");
    } catch {
      /* private browsing — mute simply won't persist */
    }
  }

  private ready(): { ctx: AudioContext; master: GainNode } | null {
    if (this.muted || !this.ctx || !this.master) return null;
    if (this.ctx.state !== "running") return null;
    return { ctx: this.ctx, master: this.master };
  }

  private noise(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer) return this.noiseBuffer;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buf;
    return buf;
  }

  /** Dobby meeting the glass. Force 0→1. */
  thud(force = 0.6) {
    const r = this.ready();
    if (!r) return;
    const { ctx, master } = r;
    const t = ctx.currentTime;
    const vol = 0.16 + force * 0.34;

    // Body: a fast downward sine sweep.
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150 + force * 70, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.16);
    oscGain.gain.setValueAtTime(vol, t);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    osc.connect(oscGain).connect(master);
    osc.start(t);
    osc.stop(t + 0.24);

    // Transient: filtered noise click so it reads as contact, not just bass.
    const src = ctx.createBufferSource();
    src.buffer = this.noise(ctx);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1600 + force * 1400;
    bp.Q.value = 0.8;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(vol * 0.5, t);
    nGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    src.connect(bp).connect(nGain).connect(master);
    src.start(t);
    src.stop(t + 0.1);
  }

  /** "Oof." Pitch varies so repeated hits don't sound looped. */
  grunt(force = 0.6) {
    const r = this.ready();
    if (!r) return;
    const { ctx, master } = r;
    const t = ctx.currentTime;
    const base = 128 + Math.random() * 46 + force * 30;
    const dur = 0.17 + Math.random() * 0.09;

    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(base * 1.35, t);
    osc.frequency.exponentialRampToValueAtTime(base * 0.72, t + dur);

    // Two formants ≈ an "uh" vowel.
    const f1 = ctx.createBiquadFilter();
    f1.type = "bandpass";
    f1.frequency.value = 660 + Math.random() * 130;
    f1.Q.value = 7;

    const f2 = ctx.createBiquadFilter();
    f2.type = "bandpass";
    f2.frequency.value = 1180 + Math.random() * 220;
    f2.Q.value = 9;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.3 + force * 0.3, t + 0.018);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(f1);
    osc.connect(f2);
    f1.connect(g);
    f2.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  /** The chamber ringing — high, glassy, brief. */
  glass(force = 0.5) {
    const r = this.ready();
    if (!r) return;
    const { ctx, master } = r;
    const t = ctx.currentTime;
    [2400, 3170, 4650].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq * (0.99 + Math.random() * 0.02);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime((0.05 + force * 0.06) / (i + 1), t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5 + i * 0.1);
      osc.connect(g).connect(master);
      osc.start(t);
      osc.stop(t + 0.7);
    });
  }

  /** Sting under the verdict card. Each tone gets its own little motif. */
  verdict(tone: ToneName) {
    const r = this.ready();
    if (!r) return;
    const { ctx, master } = r;
    const t = ctx.currentTime;

    const motifs: Record<ToneName, number[]> = {
      yes: [392, 523.25, 659.25],
      no: [261.63, 233.08, 196],
      maybe: [349.23, 415.3, 349.23],
      chaotic: [311.13, 466.16, 415.3, 622.25],
    };

    motifs[tone].forEach((freq, i) => {
      const at = t + i * 0.1;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, at);
      g.gain.linearRampToValueAtTime(0.14, at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.42);
      osc.connect(g).connect(master);
      osc.start(at);
      osc.stop(at + 0.45);
    });
  }
}

export const audio = new DobbyAudio();

/** Vibration is unsupported on iOS Safari — every call is best-effort. */
export function haptic(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* no-op */
  }
}

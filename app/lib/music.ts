/* Ambient background music for app mode — synthesized live with
 * WebAudio, no audio files, works fully offline.
 *
 * A slow pad cycles Am9 - Fmaj7 - Cmaj7 - G6 under a sparse pentatonic
 * arp. Everything runs through one master gain so the AppBar slider and
 * mute toggle have a single control point. Volume and mute persist in
 * localStorage under `m4ster-app-volume`; the default level is 0.20. */

export const VOLUME_STORAGE_KEY = "m4ster-app-volume";
export const DEFAULT_VOLUME = 0.2;

export type VolumeState = { volume: number; muted: boolean };

export function loadVolumeState(): VolumeState {
  if (typeof window === "undefined") {
    return { volume: DEFAULT_VOLUME, muted: false };
  }
  try {
    const raw = window.localStorage.getItem(VOLUME_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<VolumeState>;
      const volume =
        typeof parsed.volume === "number" &&
        parsed.volume >= 0 &&
        parsed.volume <= 1
          ? parsed.volume
          : DEFAULT_VOLUME;
      return { volume, muted: parsed.muted === true };
    }
  } catch {
    /* corrupted storage — fall back to defaults */
  }
  return { volume: DEFAULT_VOLUME, muted: false };
}

export function saveVolumeState(state: VolumeState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(VOLUME_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable (private mode) — music just won't persist */
  }
}

const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

/* Chord tones as MIDI notes, low register first. */
const CHORDS: number[][] = [
  [45, 52, 57, 59, 64], // Am9:  A2 E3 A3 B3 E4
  [41, 48, 53, 57, 64], // Fmaj7: F2 C3 F3 A3 E4
  [36, 48, 55, 59, 64], // Cmaj7: C2 C3 G3 B3 E4
  [43, 50, 55, 59, 62], // G6:   G2 D3 G3 B3 D4
];

const CHORD_SECONDS = 7;
const PAD_PEAK = 0.11; // per-chord pad gain before the master fader
const ARP_PEAK = 0.05;

class AmbientMusic {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private padTimer: number | null = null;
  private arpTimer: number | null = null;
  private chordIndex = 0;
  private state: VolumeState = { volume: DEFAULT_VOLUME, muted: false };
  started = false;

  /** Create the context and start the loop. Must be called from (or
      after) a user gesture or the context stays suspended — we resume
      on every call, so the first real tap unblocks it. */
  start(state: VolumeState): void {
    this.state = state;
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.effectiveGain();
      // One shared lowpass keeps the pad warm and unobtrusive.
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1100;
      filter.Q.value = 0.4;
      this.master.connect(filter);
      filter.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume().catch(() => undefined);
    }
    if (this.started) return;
    this.started = true;
    this.schedulePad();
    this.padTimer = window.setInterval(
      () => this.schedulePad(),
      CHORD_SECONDS * 1000,
    );
    this.arpTimer = window.setInterval(() => this.maybeArp(), 640);
  }

  setVolume(state: VolumeState): void {
    this.state = state;
    if (this.ctx && this.master) {
      // Smooth ramps only — instant gain steps click.
      this.master.gain.setTargetAtTime(
        this.effectiveGain(),
        this.ctx.currentTime,
        0.08,
      );
    }
  }

  private effectiveGain(): number {
    if (this.state.muted) return 0;
    // Gentle curve so the default 0.20 sits quietly under gameplay.
    return Math.pow(this.state.volume, 1.5) * 0.9;
  }

  private schedulePad(): void {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const now = ctx.currentTime + 0.05;
    const chord = CHORDS[this.chordIndex % CHORDS.length];
    this.chordIndex += 1;

    const chordGain = ctx.createGain();
    chordGain.gain.setValueAtTime(0, now);
    chordGain.gain.linearRampToValueAtTime(PAD_PEAK, now + 2.4);
    chordGain.gain.setValueAtTime(PAD_PEAK, now + CHORD_SECONDS - 1.6);
    chordGain.gain.linearRampToValueAtTime(0, now + CHORD_SECONDS + 1.2);
    chordGain.connect(this.master);

    for (const note of chord) {
      const freq = midi(note);
      // Two slightly detuned triangles plus a sine an octave under the
      // root give the pad its width without any harshness.
      for (const detune of [-5, 5]) {
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.value = freq;
        osc.detune.value = detune;
        const voiceGain = ctx.createGain();
        voiceGain.gain.value = 0.32;
        osc.connect(voiceGain);
        voiceGain.connect(chordGain);
        osc.start(now);
        osc.stop(now + CHORD_SECONDS + 1.4);
      }
    }
    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.value = midi(chord[0] - 12);
    const subGain = ctx.createGain();
    subGain.gain.value = 0.5;
    sub.connect(subGain);
    subGain.connect(chordGain);
    sub.start(now);
    sub.stop(now + CHORD_SECONDS + 1.4);
  }

  private maybeArp(): void {
    if (!this.ctx || !this.master) return;
    if (this.state.muted || this.state.volume === 0) return;
    if (Math.random() > 0.42) return; // sparse — most ticks stay silent
    const ctx = this.ctx;
    const chord = CHORDS[(this.chordIndex + CHORDS.length - 1) % CHORDS.length];
    const pool = [...chord.slice(2), chord[2] + 12, chord[3] + 12];
    const note = pool[Math.floor(Math.random() * pool.length)];
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = midi(note);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(ARP_PEAK, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 1.5);
  }
}

/** Module-level singleton: one engine per page, however many components
    ask for it. */
export const ambientMusic = new AmbientMusic();

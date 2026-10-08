/**
 * Unique Dispatch - Browser Web Audio Chime & Alert Engine
 * Synthesizes professional, zero-latency audio alerts for critical dispatch events.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (e) {
    return null;
  }
}

export function isAudioEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const saved = localStorage.getItem("unique_dispatch_audio_enabled");
    return saved !== "false";
  } catch (e) {
    return true;
  }
}

export function setAudioEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("unique_dispatch_audio_enabled", enabled ? "true" : "false");
  } catch (e) {
    // ignore
  }
}

/**
 * Pleasant 2-tone chime for 3.5h Pre-Trip & 30m Delivery Milestones
 */
export function playMilestoneChime(): void {
  if (!isAudioEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Tone 1: 587.33 Hz (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2: 880 Hz (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.15);
    gain2.gain.setValueAtTime(0.18, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.15);
    osc2.stop(now + 0.6);
  } catch (e) {
    // ignore audio block
  }
}

/**
 * Urgent 3-Pulse alarm for breakdowns, mechanical failures & critical delayed loads
 */
export function playUrgentAlert(): void {
  if (!isAudioEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    [0, 0.18, 0.36].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(740, now + offset); // F#5
      gain.gain.setValueAtTime(0.22, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + offset);
      osc.stop(now + offset + 0.12);
    });
  } catch (e) {
    // ignore
  }
}

/**
 * High-Impact Emergency Siren (Dual Alternating High-Low Frequencies)
 */
export function playEmergencySiren(): void {
  if (!isAudioEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.linearRampToValueAtTime(950, now + 0.25);
    osc.frequency.linearRampToValueAtTime(650, now + 0.5);
    osc.frequency.linearRampToValueAtTime(950, now + 0.75);
    osc.frequency.linearRampToValueAtTime(650, now + 1.0);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 1.05);
  } catch (e) {
    // ignore
  }
}

/**
 * Upbeat harmonic chime for successful sync or load creation
 */
export function playSuccessChime(): void {
  if (!isAudioEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.12, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.3);
    });
  } catch (e) {
    // ignore
  }
}

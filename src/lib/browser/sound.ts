"use client";

let ctx: AudioContext | null = null;

const PATTERNS = {
  blip: [[880, 0.06]],
  done: [
    [660, 0.07],
    [990, 0.1],
  ],
  alarm: [
    [880, 0.12],
    [0, 0.06],
    [880, 0.12],
    [0, 0.06],
    [1320, 0.2],
  ],
} as const satisfies Record<string, readonly (readonly [number, number])[]>;

/** 8-bit square-wave chiptune blips via WebAudio (no audio files to fetch). */
export function playBeep(kind: keyof typeof PATTERNS = "blip"): void {
  try {
    ctx ??= new AudioContext();
    let t = ctx.currentTime;
    for (const [freq, dur] of PATTERNS[kind]) {
      if (freq > 0) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + dur);
      }
      t += dur;
    }
  } catch {
    /* audio unavailable */
  }
}

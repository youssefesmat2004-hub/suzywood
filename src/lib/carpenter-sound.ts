// Generates a short bell ping using the Web Audio API. No asset file needed.
let ctx: AudioContext | null = null;

export function unlockCarpenterAudio() {
  if (typeof window === "undefined") return;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    // ignore
  }
}

export function playCarpenterAlert() {
  if (typeof window === "undefined") return;
  try {
    unlockCarpenterAudio();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Two-tone ping: high → higher, short, loud-ish.
    [
      { freq: 1320, start: 0, dur: 0.18 },
      { freq: 1760, start: 0.18, dur: 0.22 },
    ].forEach(({ freq, start, dur }) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.4, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.02);
    });
  } catch {
    // ignore
  }
}
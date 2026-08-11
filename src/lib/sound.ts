/**
 * Short confirmation chime played only after a sale is confirmed saved.
 * Uses WebAudio so we don't ship an audio asset; silently no-ops where the
 * API is unavailable (sound is a nicety, never a correctness signal).
 */
export function playSaleCompleteSound(): void {
  if (typeof window === "undefined") return;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;
  try {
    const ctx = new Ctor();
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    gain.connect(ctx.destination);

    [880, 1318.5].forEach((freq, index) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + index * 0.09);
      osc.connect(gain);
      osc.start(now + index * 0.09);
      osc.stop(now + 0.5);
    });

    window.setTimeout(() => void ctx.close().catch(() => undefined), 800);
  } catch {
    /* audio blocked — not a failure worth surfacing */
  }
}

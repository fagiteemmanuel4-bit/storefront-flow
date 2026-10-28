/** Device feedback is intentionally non-critical: blocked audio/haptics never affect a sale. */
import { readPreferences } from "@/lib/preferences";

function beep(frequencies: number[], duration = 0.24, gainValue = 0.28): void {
  if (typeof window === "undefined" || !readPreferences().sound) return;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;
  try {
    const ctx = new Ctor(); const now = ctx.currentTime; const gain = ctx.createGain(); gain.gain.setValueAtTime(0.0001, now); gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.015); gain.gain.exponentialRampToValueAtTime(0.0001, now + duration); gain.connect(ctx.destination);
    frequencies.forEach((frequency, index) => { const osc = ctx.createOscillator(); osc.type = "sine"; osc.frequency.setValueAtTime(frequency, now + index * 0.06); osc.connect(gain); osc.start(now + index * 0.06); osc.stop(now + duration); });
    window.setTimeout(() => void ctx.close().catch(() => undefined), 700);
  } catch { /* audio blocked */ }
}

export function triggerHaptic(pattern: number | number[] = 35): void {
  if (typeof navigator === "undefined" || !readPreferences().haptics || typeof navigator.vibrate !== "function") return;
  try { navigator.vibrate(pattern); } catch { /* vibration unavailable */ }
}

export function playBarcodeScanFeedback(): void { beep([1046], 0.16, 0.32); triggerHaptic(45); }
export function playSaleCompleteSound(): void { beep([880, 1318.5], 0.5, 0.22); triggerHaptic([30, 35, 30]); }
export function playErrorFeedback(): void { beep([220, 165], 0.28, 0.18); triggerHaptic([55, 35, 55]); }

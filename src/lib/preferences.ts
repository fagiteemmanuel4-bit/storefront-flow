/**
 * Local, per-device app preferences. Never authoritative for business logic —
 * these only tune feedback (sound, haptics, density) on this device.
 */
export type Preferences = {
  sound: boolean;
  haptics: boolean;
  compact: boolean;
};

const KEY = "kudi.preferences";

export const DEFAULT_PREFERENCES: Preferences = { sound: true, haptics: true, compact: false };

export function readPreferences(): Preferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return {
      sound: parsed.sound ?? DEFAULT_PREFERENCES.sound,
      haptics: parsed.haptics ?? DEFAULT_PREFERENCES.haptics,
      compact: parsed.compact ?? DEFAULT_PREFERENCES.compact,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function writePreferences(next: Preferences): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage disabled — preferences simply don't persist on this device */
  }
}

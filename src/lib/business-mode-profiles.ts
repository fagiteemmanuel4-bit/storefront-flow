import { businessModeProfileSchema, type BusinessModeProfile } from "./business-mode-profile.schema";

type ProfileError = {
  modeKey: string;
  profileId?: string;
  issues: string[];
};

export type BusinessModeProfileResult =
  | { ok: true; profile: BusinessModeProfile }
  | { ok: false; error: ProfileError };

type ImportedProfile = { default?: unknown } | unknown;

const profileModules = import.meta.glob<ImportedProfile>("../../modes/*/mode.json", {
  eager: true,
});

const profilesByMode = new Map<string, BusinessModeProfile>();
const errorsByMode = new Map<string, ProfileError>();

for (const [path, imported] of Object.entries(profileModules)) {
  const raw = imported && typeof imported === "object" && "default" in imported
    ? imported.default
    : imported;
  const parsed = businessModeProfileSchema.safeParse(raw);
  const pathModeKey = path.split("/").at(-2) ?? path;

  if (!parsed.success) {
    errorsByMode.set(pathModeKey, {
      modeKey: pathModeKey,
      issues: parsed.error.issues.map((issue) => `${issue.path.join(".") || "profile"}: ${issue.message}`),
    });
    continue;
  }

  const profile = parsed.data;
  for (const modeKey of profile.businessModeKeys) {
    if (profilesByMode.has(modeKey)) {
      errorsByMode.set(modeKey, {
        modeKey,
        profileId: profile.id,
        issues: [`More than one profile claims business mode key "${modeKey}".`],
      });
      profilesByMode.delete(modeKey);
      continue;
    }
    if (!errorsByMode.has(modeKey)) profilesByMode.set(modeKey, profile);
  }
}

/**
 * Resolve a profile without fallback. Missing or invalid profiles are explicit errors.
 */
export function getBusinessModeProfile(modeKey: string): BusinessModeProfileResult {
  const normalized = modeKey.trim().toLowerCase();
  const error = errorsByMode.get(normalized);
  if (error) return { ok: false, error };

  const profile = profilesByMode.get(normalized);
  if (!profile) {
    return {
      ok: false,
      error: { modeKey: normalized, issues: [`No business-mode profile is registered for "${normalized}".`] },
    };
  }
  if (profile.status === "deprecated") {
    return {
      ok: false,
      error: { modeKey: normalized, profileId: profile.id, issues: ["This business-mode profile is deprecated."] },
    };
  }
  return { ok: true, profile };
}

/**
 * Feature flags fail closed: draft profiles and non-ready runtimes can never enable a flag.
 */
export function isBusinessModeFeatureEnabled(
  profile: BusinessModeProfile,
  featureId: string,
): boolean {
  return profile.status === "active"
    && profile.runtimeReady
    && profile.featureFlags.flags[featureId] === true;
}

/** Exposed for diagnostics and validation tooling; does not activate any profile. */
export function getBusinessModeProfileDiagnostics(): ProfileError[] {
  return [...errorsByMode.values()];
}

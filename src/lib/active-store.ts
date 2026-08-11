/**
 * Client-only cache of the shop/branch the user last worked in.
 *
 * This snapshot is read on boot to avoid a flash of the wrong store, so every
 * code path that CHANGES the active store must write through these helpers.
 * A never-written cache silently breaks the "pick up where you left off" flow.
 */
const STORE_KEY = "kudi.activeStoreId";
const BRANCH_KEY = "kudi.activeBranchId";

function read(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(key);
    return value && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (value) window.localStorage.setItem(key, value);
    else window.localStorage.removeItem(key);
  } catch {
    /* private mode / storage disabled — non-fatal, we just lose the shortcut */
  }
}

export const activeStoreCache = {
  getStoreId: () => read(STORE_KEY),
  setStoreId: (id: string | null) => write(STORE_KEY, id),
  getBranchId: () => read(BRANCH_KEY),
  setBranchId: (id: string | null) => write(BRANCH_KEY, id),
  clear: () => {
    write(STORE_KEY, null);
    write(BRANCH_KEY, null);
  },
};

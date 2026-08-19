/**
 * Release notes shown to every signed-in user once per version.
 * Add a new entry at the top whenever we ship something worth announcing.
 */
export type AppUpdate = { version: string; date: string; title: string; items: string[] };

export const APP_UPDATES: AppUpdate[] = [
  {
    version: "2026.08.2",
    date: "19 Aug 2026",
    title: "Customers, offline sales & receipts",
    items: [
      "Save regular customers and attach them to sales so visits and spending build a useful history.",
      "Sales can now be queued safely on the device when the connection drops and sync automatically when you reconnect.",
      "Print receipts directly from the completed-sale screen, including to printers available through your computer or device print system.",
      "A guided Kudi tour now helps new users learn the register, stock, customers, reports and menu.",
    ],
  },
  {
    version: "2026.08.1",
    date: "14 Aug 2026",
    title: "Shelves, smoother sheets & password recovery",
    items: [
      "Group products on shelves you name yourself — Books, Drinks, Accessories, anything.",
      "Filter your stock list by shelf in one tap.",
      "Every pop-up now locks the page behind it, so no more accidental background scrolling.",
      "Forgot your password? Reset it straight from the sign-in screen.",
    ],
  },
];

export const LATEST_UPDATE: AppUpdate = APP_UPDATES[0]!;
const STORAGE_KEY = "kudi.last-seen-update";
export function getLastSeenUpdate(): string | null { if (typeof window === "undefined") return null; try { return window.localStorage.getItem(STORAGE_KEY); } catch { return null; } }
export function markUpdateSeen(version: string): void { if (typeof window === "undefined") return; try { window.localStorage.setItem(STORAGE_KEY, version); } catch {} }
export function hasUnseenUpdate(): boolean { return getLastSeenUpdate() !== LATEST_UPDATE.version; }

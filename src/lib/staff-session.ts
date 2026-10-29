export type StaffRole = "manager" | "cashier" | "inventory" | "sales" | "viewer";

export type StaffSession = {
  id: string;
  storeId: string;
  name: string;
  role: StaffRole;
  signedInAt: string;
};

const KEY = "kudi-staff-session";
const EVENT = "kudi-staff-session-changed";

export const STAFF_ROLE_META: Record<StaffRole, { label: string; description: string; defaultRoute: string }> = {
  manager: { label: "Manager", description: "Sales, stock, reports and store operations", defaultRoute: "/dashboard" },
  cashier: { label: "Cashier", description: "Sell products and manage customers", defaultRoute: "/pos" },
  inventory: { label: "Inventory", description: "Stock, products and imports", defaultRoute: "/products" },
  sales: { label: "Sales", description: "Sales floor, customers and reports", defaultRoute: "/pos" },
  viewer: { label: "Viewer", description: "Read-only dashboard and reports", defaultRoute: "/dashboard" },
};

export function getStaffSession(storeId?: string | null): StaffSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as StaffSession;
    if (!session?.id || !session?.storeId || (storeId && session.storeId !== storeId)) return null;
    return session;
  } catch {
    return null;
  }
}

export function setStaffSession(session: StaffSession) {
  window.localStorage.setItem(KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(EVENT));
}

export function clearStaffSession() {
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeStaffSession(listener: () => void) {
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}

const PERMISSIONS: Record<StaffRole, Set<string>> = {
  manager: new Set(["dashboard", "pos", "products", "customers", "reports", "expenses", "import", "online-store", "help"]),
  cashier: new Set(["pos", "customers", "help"]),
  inventory: new Set(["products", "import", "dashboard", "help"]),
  sales: new Set(["pos", "customers", "reports", "dashboard", "help"]),
  viewer: new Set(["dashboard", "reports", "help"]),
};

export function staffCan(role: StaffRole, area: string) {
  return PERMISSIONS[role]?.has(area) ?? false;
}

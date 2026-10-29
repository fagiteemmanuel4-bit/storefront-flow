export type OfflineSaleItem = { product_id: string; quantity: number };

export type OfflineSale = {
  offlineId: string;
  storeId: string;
  branchId: string;
  paymentMethod: "cash" | "card" | "transfer" | "credit";
  items: OfflineSaleItem[];
  customerId: string | null;
  note: string;
  createdAt: string;
};

const KEY = "kudi.offline-sales.v1";

function readQueue(): OfflineSale[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]") as OfflineSale[]; } catch { return []; }
}

function writeQueue(queue: OfflineSale[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(queue));
  window.dispatchEvent(new Event("kudi-offline-queue-changed"));
}

export function getOfflineSales(): OfflineSale[] { return readQueue(); }

export function enqueueOfflineSale(sale: OfflineSale) {
  const queue = readQueue();
  if (!queue.some((item) => item.offlineId === sale.offlineId)) writeQueue([...queue, sale]);
}

export function removeOfflineSale(offlineId: string) {
  writeQueue(readQueue().filter((item) => item.offlineId !== offlineId));
}

export function offlineSaleCount() { return readQueue().length; }

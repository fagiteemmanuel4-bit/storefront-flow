import type { Database } from "@/integrations/supabase/types";

export type StoreRow = Database["public"]["Tables"]["stores"]["Row"];
export type BranchRow = Database["public"]["Tables"]["branches"]["Row"];
export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type BranchStockRow = Database["public"]["Tables"]["branch_stock"]["Row"];
export type SaleRow = Database["public"]["Tables"]["sales"]["Row"];
export type SaleItemRow = Database["public"]["Tables"]["sale_items"]["Row"];
export type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];
export type StoreRole = Database["public"]["Enums"]["store_role"];
export type PaymentMethod = Database["public"]["Enums"]["payment_method"];

export type ProductWithStock = ProductRow & { quantity: number };

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "transfer", label: "Transfer" },
  { value: "credit", label: "On credit" },
];

export function canManageCatalog(role: StoreRole | null): boolean {
  return role === "owner" || role === "manager";
}

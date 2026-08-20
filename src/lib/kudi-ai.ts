import { SUPABASE_URL } from "@/integrations/supabase/config";

export type KudiNotificationEvent =
  | "low_stock"
  | "out_of_stock"
  | "order_received"
  | "sale_completed"
  | "import_complete"
  | "general";

export type KudiNotificationContext = Record<string, unknown>;

export async function getKudiNotification(
  event: KudiNotificationEvent,
  context: KudiNotificationContext = {},
): Promise<{ message: string; ai: boolean }> {
  const fallback = fallbackNotification(event, context);

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/kudi-ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "notification", event, context }),
    });

    if (!response.ok) return { message: fallback, ai: false };

    const data = (await response.json()) as { message?: unknown; ai?: unknown };
    if (typeof data.message !== "string" || !data.message.trim()) {
      return { message: fallback, ai: false };
    }

    return { message: data.message.trim(), ai: data.ai === true };
  } catch {
    return { message: fallback, ai: false };
  }
}

function fallbackNotification(
  event: KudiNotificationEvent,
  context: KudiNotificationContext,
) {
  const product = typeof context.productName === "string" ? context.productName : "an item";
  const count = typeof context.count === "number" ? context.count : undefined;
  const total = typeof context.total === "number" ? context.total : undefined;

  switch (event) {
    case "low_stock":
      return `${product} is running low${count !== undefined ? ` — ${count} left` : ""}. You may want to restock soon.`;
    case "out_of_stock":
      return `${product} is out of stock. Restock it when you're ready to keep sales moving.`;
    case "order_received":
      return `New order received${total !== undefined ? ` for ₦${total.toLocaleString()}` : ""}. It's ready for your attention.`;
    case "sale_completed":
      return `Sale completed${total !== undefined ? ` — ₦${total.toLocaleString()}` : ""}. Your stock has been updated.`;
    case "import_complete":
      return `Import complete. ${count ?? "Your"} product${count === 1 ? " is" : "s are"} ready in Kudi.`;
    default:
      return "Kudi has an update for you.";
  }
}

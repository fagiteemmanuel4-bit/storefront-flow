import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
async function hmacHex(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const payload = JSON.parse(await req.text());
    const data = payload?.data ?? {};
    const secret = Deno.env.get("KORAPAY_SECRET_KEY");
    if (!secret) return json({ error: "Webhook not configured" }, 500);
    const provided = (req.headers.get("x-korapay-signature") ?? "").trim().toLowerCase();
    const expected = (await hmacHex(secret, JSON.stringify(data))).toLowerCase();
    if (!provided || !constantTimeEqual(provided, expected))
      return json({ error: "Invalid signature" }, 401);
    const reference = String(data.payment_reference || data.reference || "").trim();
    if (!reference) return json({ error: "Missing payment reference" }, 400);
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const event = String(payload.event ?? ""),
      status = String(data.status ?? "").toLowerCase();
    if (event === "charge.failed" || status === "failed") {
      const { error } = await admin
        .from("billing_transactions")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
          metadata: { webhook: data },
        })
        .eq("provider", "korapay")
        .eq("provider_reference", reference)
        .eq("status", "pending");
      if (error) throw error;
      return json({ ok: true });
    }
    if (event !== "charge.success" || status !== "success") return json({ ok: true });
    const amount = Number(data.amount),
      currency = String(data.currency ?? "").toUpperCase();
    if (!Number.isFinite(amount) || amount <= 0 || !currency)
      return json({ error: "Invalid payment amount or currency" }, 400);
    const { data: result, error } = await admin.rpc("process_korapay_billing_success", {
      p_reference: reference,
      p_amount: amount,
      p_currency: currency,
      p_webhook: data,
    });
    if (error) throw error;
    if (result === "amount_or_currency_mismatch")
      return json({ error: "Payment details do not match the pending transaction" }, 409);
    if (result === "not_found" || result === "not_pending")
      console.warn("KoraPay webhook did not match pending transaction", { reference, result });
    return json({ ok: true, result });
  } catch (error) {
    console.error("KoraPay webhook error", error instanceof Error ? error.message : String(error));
    return json({ error: "Webhook processing failed" }, 500);
  }
});

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const reply = (body: string, status = 200) =>
  new Response(body, { status, headers: { "Content-Type": "text/plain" } });
async function hmac(secret: string, raw: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function equal(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
Deno.serve(async (req) => {
  if (req.method !== "POST") return reply("Method not allowed", 405);
  try {
    const raw = await req.text(),
      secret = Deno.env.get("PAYSTACK_SECRET_KEY") ?? "";
    if (!secret) return reply("Webhook not configured", 500);
    const provided = (req.headers.get("x-paystack-signature") ?? "").trim().toLowerCase(),
      expected = (await hmac(secret, raw)).toLowerCase();
    if (!provided || !equal(provided, expected)) return reply("Invalid signature", 401);
    const event = JSON.parse(raw),
      data = event?.data ?? {},
      reference = String(data.reference ?? "").trim();
    if (!reference) return reply("ok");
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    if (event.event === "charge.failed") {
      const { error } = await admin
        .from("payment_transactions")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
          metadata: { provider_event: data },
        })
        .eq("provider", "paystack")
        .eq("provider_reference", reference)
        .eq("status", "pending");
      if (error) throw error;
      return reply("ok");
    }
    if (event.event !== "charge.success") return reply("ok");
    const { data: pending, error: lookupError } = await admin
      .from("payment_transactions")
      .select("id,amount,currency,status")
      .eq("provider", "paystack")
      .eq("provider_reference", reference)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!pending || pending.status !== "pending") return reply("ok");
    const verify = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secret}` } },
    );
    const verified = await verify.json();
    if (
      !verify.ok ||
      !verified.status ||
      verified.data?.status !== "success" ||
      verified.data?.reference !== reference
    )
      return reply("Payment verification failed", 409);
    const amount = Number(verified.data.amount) / 100,
      currency = String(verified.data.currency ?? "").toUpperCase();
    if (
      !Number.isFinite(amount) ||
      amount !== Number(pending.amount) ||
      currency !== String(pending.currency).toUpperCase()
    )
      return reply("Payment details do not match the pending transaction", 409);
    const { data: result, error } = await admin.rpc("process_paystack_subscription_success", {
      p_reference: reference,
      p_amount: amount,
      p_currency: currency,
      p_webhook: data,
    });
    if (error) throw error;
    if (result === "amount_or_currency_mismatch" || result === "invalid_plan_metadata")
      return reply("Payment details rejected", 409);
    return reply("ok");
  } catch (error) {
    console.error("Paystack webhook error", error instanceof Error ? error.message : String(error));
    return reply("Webhook processing failed", 500);
  }
});

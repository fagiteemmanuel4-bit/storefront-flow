import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405);
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return reply({ error: "Unauthorized" }, 401);
    const url = Deno.env.get("SUPABASE_URL")!, anonKey = Deno.env.get("SUPABASE_ANON_KEY")!, serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: auth } } }), admin = createClient(url, serviceKey);
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return reply({ error: "Unauthorized" }, 401);
    const body = await req.json(), storeId = String(body.store_id ?? "").trim(), email = String(body.email ?? user.email ?? "").trim(), amount = Number(body.amount);
    if (!storeId || !email || !Number.isFinite(amount) || amount <= 0) return reply({ error: "A store, email and valid amount are required" }, 400);
    const { data: member, error: memberError } = await userClient.from("store_members").select("id").eq("store_id", storeId).eq("user_id", user.id).maybeSingle();
    if (memberError || !member) return reply({ error: "Forbidden" }, 403);
    const { data: plan, error: planError } = await admin.from("platform_plan_prices").select("plan_code,billing_interval,currency,amount").eq("country_code", "NG").eq("currency", "NGN").eq("is_active", true).eq("amount", amount).maybeSingle();
    if (planError || !plan) return reply({ error: "The requested price does not match an active Nigeria plan" }, 400);
    const key = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!key) return reply({ error: "Payment provider is not configured" }, 503);
    const reference = `STRAP-PS-${crypto.randomUUID()}`;
    const { data: tx, error: txError } = await admin.from("payment_transactions").insert({ store_id: storeId, provider: "paystack", provider_reference: reference, amount: Number(plan.amount), currency: "NGN", status: "pending", metadata: { purpose: "subscription", plan_code: plan.plan_code, billing_interval: plan.billing_interval, user_id: user.id } }).select("id").single();
    if (txError || !tx) throw txError ?? new Error("Unable to create payment record");
    const response = await fetch("https://api.paystack.co/transaction/initialize", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ email, amount: Math.round(Number(plan.amount) * 100), currency: "NGN", reference, callback_url: body.callback_url || undefined, metadata: { store_id: storeId, purpose: "subscription", plan_code: plan.plan_code, billing_interval: plan.billing_interval, transaction_id: tx.id } }) });
    const payload = await response.json();
    if (!response.ok || !payload.status || !payload.data?.authorization_url) {
      await admin.from("payment_transactions").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", tx.id).eq("status", "pending");
      return reply({ error: payload.message || "Paystack initialization failed" }, 502);
    }
    return reply({ ...payload.data, reference, transaction_id: tx.id });
  } catch (error) {
    console.error("Paystack checkout error", error instanceof Error ? error.message : String(error));
    return reply({ error: "Unable to initialize payment" }, 500);
  }
});
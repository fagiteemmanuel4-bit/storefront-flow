import { Webhook } from "npm:standardwebhooks@1";
const HOOK_SECRET = (Deno.env.get("SEND_EMAIL_HOOK_SECRET") ?? "").replace("v1,whsec_", "");
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: { http_code: 405, message: "Method not allowed" } }, 405);
  if (!HOOK_SECRET) return json({ error: { http_code: 500, message: "Send Email Hook secret is not configured" } }, 500);
  try {
    const raw = await req.text();
    const event = new Webhook(HOOK_SECRET).verify(raw, Object.fromEntries(req.headers.entries())) as { user?: { email?: string; user_metadata?: Record<string, unknown> }; email_data?: { token?: string; email_action_type?: string } };
    const email = event.user?.email, token = event.email_data?.token, action = event.email_data?.email_action_type ?? "verification";
    if (!email || !token) return json({ error: { http_code: 400, message: "Missing recipient email or OTP token" } }, 400);
    const serviceId = Deno.env.get("EMAILJS_SERVICE_ID"), templateId = Deno.env.get("EMAILJS_TEMPLATE_ID"), publicKey = Deno.env.get("EMAILJS_PUBLIC_KEY");
    if (!serviceId || !templateId || !publicKey) return json({ error: { http_code: 500, message: "Email provider is not configured" } }, 500);
    const name = String(event.user?.user_metadata?.full_name ?? event.user?.user_metadata?.name ?? "Strap user");
    const provider = await fetch("https://api.emailjs.com/api/v1.0/email/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ service_id: serviceId, template_id: templateId, user_id: publicKey, template_params: { otp: token, to_email: email, user_email: email, email, name, action_type: action, app_name: "Strap" } }) });
    if (!provider.ok) { console.error("EmailJS delivery failed", { status: provider.status, action }); return json({ error: { http_code: 502, message: "Email provider rejected the message" } }, 502); }
    return json({});
  } catch (error) {
    console.error("Send Email Hook verification failed", error instanceof Error ? error.message : String(error));
    return json({ error: { http_code: 401, message: "Unable to verify or process the Send Email Hook request" } }, 401);
  }
});

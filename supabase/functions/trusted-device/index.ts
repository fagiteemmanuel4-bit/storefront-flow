import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Action = "check" | "register" | "revoke";
type Body = { action?: Action; token?: string };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function browserFamily(ua: string) {
  if (/Edg\//.test(ua)) return "Edge";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return "Chrome";
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "Safari";
  return "Other";
}

function requestIp(req: Request): string | null {
  const candidate = (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0] ??
    ""
  ).trim();
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(candidate)) return candidate;
  if (candidate.includes(":") && /^[0-9a-f:]+$/i.test(candidate)) return candidate;
  return null;
}

async function hashToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function validToken(token: unknown): token is string {
  return typeof token === "string" && /^[A-Za-z0-9_-]{40,100}$/.test(token);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
  const jwt = authHeader.slice(7).trim();
  if (!jwt) return json({ error: "Unauthorized" }, 401);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !authData.user) return json({ error: "Unauthorized" }, 401);

    const body = (await req.json().catch(() => ({}))) as Body;
    const action = body.action ?? "check";
    if (!["check", "register", "revoke"].includes(action)) {
      return json({ error: "Unknown action" }, 400);
    }
    if (!validToken(body.token)) return json({ error: "A valid device token is required." }, 400);

    const userId = authData.user.id;
    const tokenHash = await hashToken(body.token);
    const ua = req.headers.get("user-agent") ?? "";
    const family = browserFamily(ua);
    const ip = requestIp(req);

    if (action === "register") {
      const { error } = await supabase.from("trusted_auth_devices").upsert(
        {
          user_id: userId,
          token_hash: tokenHash,
          user_agent_family: family,
          first_ip: ip,
          last_ip: ip,
          last_seen_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          revoked_at: null,
        },
        { onConflict: "user_id,token_hash" },
      );
      if (error) throw error;
      await supabase.from("auth_security_events").insert({
        user_id: userId,
        event_type: "trusted_device_registered",
        risk_level: "low",
        ip_address: ip,
        user_agent_family: family,
      });
      await supabase.from("auth_security_events").delete()
        .eq("user_id", userId)
        .lt("created_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());
      return json({ registered: true, expiresInDays: 30 });
    }

    if (action === "revoke") {
      const { error } = await supabase.from("trusted_auth_devices")
        .update({ revoked_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("token_hash", tokenHash)
        .is("revoked_at", null);
      if (error) throw error;
      return json({ revoked: true });
    }

    const { data: device, error } = await supabase.from("trusted_auth_devices")
      .select("id,user_agent_family,last_ip,expires_at")
      .eq("user_id", userId)
      .eq("token_hash", tokenHash)
      .is("revoked_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (error) throw error;

    if (!device) {
      await supabase.from("auth_security_events").insert({
        user_id: userId,
        event_type: "unrecognized_device_login",
        risk_level: "medium",
        ip_address: ip,
        user_agent_family: family,
      });
      return json({ trusted: false, risk: "medium", reason: "unrecognized_device" });
    }

    if (device.user_agent_family !== family) {
      await supabase.from("auth_security_events").insert({
        user_id: userId,
        event_type: "trusted_device_browser_changed",
        risk_level: "high",
        ip_address: ip,
        user_agent_family: family,
      });
      return json({ trusted: false, risk: "high", reason: "browser_changed" });
    }

    const ipChanged = Boolean(device.last_ip && ip && device.last_ip !== ip);
    await supabase.from("trusted_auth_devices").update({
      last_ip: ip,
      last_seen_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }).eq("id", device.id);

    if (ipChanged) {
      await supabase.from("auth_security_events").insert({
        user_id: userId,
        event_type: "trusted_device_ip_changed",
        risk_level: "medium",
        ip_address: ip,
        user_agent_family: family,
      });
    }

    return json({ trusted: true, risk: ipChanged ? "medium" : "low", ipChanged });
  } catch (error) {
    console.error("trusted-device error", error);
    return json({ error: "Device security check failed." }, 500);
  }
});

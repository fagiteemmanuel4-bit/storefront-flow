import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Action = "get" | "revoke" | "revoke_all_others";
type RequestBody = { action?: Action; sessionId?: string };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getSessionIdFromToken(token: string): string | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(payload.length / 4) * 4, "=");
    const claims = JSON.parse(atob(normalized)) as { session_id?: unknown };
    return typeof claims.session_id === "string" ? claims.session_id : null;
  } catch {
    return null;
  }
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return json({ error: "Unauthorized" }, 401);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) return json({ error: "Unauthorized" }, 401);

    const userId = userData.user.id;
    const currentSessionId = getSessionIdFromToken(token);
    const body = (await req.json().catch(() => ({}))) as RequestBody;
    const action: Action = body.action ?? "get";

    const { data: sessions, error: sessionError } = await supabase.rpc("account_security_list_sessions", {
      p_user_id: userId,
    });
    if (sessionError) throw sessionError;

    const normalizedSessions = (sessions ?? []).map((session: Record<string, unknown>) => ({
      ...session,
      ip: session.ip ? String(session.ip) : null,
      current: session.session_id === currentSessionId,
    }));

    if (action === "get") {
      const { data: ipHistory, error: historyError } = await supabase.rpc("account_security_list_ip_history", {
        p_user_id: userId,
        p_limit: 25,
      });
      if (historyError) throw historyError;
      return json({ sessions: normalizedSessions, ipHistory: ipHistory ?? [] });
    }

    if (action === "revoke") {
      if (!isUuid(body.sessionId)) return json({ error: "A valid session ID is required." }, 400);
      if (body.sessionId === currentSessionId) return json({ error: "Use local sign out to end the current session." }, 400);

      const { data: revoked, error } = await supabase.rpc("account_security_revoke_session", {
        p_user_id: userId,
        p_session_id: body.sessionId,
      });
      if (error) throw error;
      return json({ revoked: Boolean(revoked) });
    }

    if (action === "revoke_all_others") {
      const otherSessions = normalizedSessions.filter((session: { current?: boolean }) => !session.current);
      const results = await Promise.all(
        otherSessions.map((session: { session_id?: unknown }) =>
          typeof session.session_id === "string"
            ? supabase.rpc("account_security_revoke_session", { p_user_id: userId, p_session_id: session.session_id })
            : Promise.resolve({ error: null }),
        ),
      );
      const failed = results.find((result) => result.error);
      if (failed?.error) throw failed.error;
      return json({ revoked: otherSessions.length });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (error) {
    console.error("account-security error", error);
    return json({ error: error instanceof Error ? error.message : "Security request failed" }, 500);
  }
});

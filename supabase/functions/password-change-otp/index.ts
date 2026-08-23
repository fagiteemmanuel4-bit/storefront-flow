import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
  const accessToken = authHeader.slice("Bearer ".length).trim();
  if (!accessToken) return json({ error: "Unauthorized" }, 401);

  const body = await req.json().catch(() => null) as { otp?: unknown; password?: unknown } | null;
  const otp = typeof body?.otp === "string" ? body.otp.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!/^\d{8}$/.test(otp)) return json({ error: "Enter the 8-digit verification code." }, 400);
  if (password.length < 8) return json({ error: "Password must contain at least 8 characters." }, 400);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "Password service is not configured." }, 500);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  try {
    const { data: userData, error: userError } = await admin.auth.getUser(accessToken);
    if (userError || !userData.user?.id || !userData.user.email) {
      return json({ error: "Your session is no longer valid. Sign in again and retry." }, 401);
    }

    const { data: verified, error: verifyError } = await admin.rpc("verify_password_change_otp", {
      p_user_id: userData.user.id,
      p_otp: otp,
    });

    if (verifyError) {
      console.error("password OTP verification error", verifyError);
      return json({ error: "We could not verify the code right now. Request a new code and try again." }, 500);
    }

    if (verified !== true) {
      return json({ error: "That code is invalid, expired, or has reached the maximum number of attempts. Request a new code and try again." }, 400);
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(userData.user.id, { password });
    if (updateError) {
      console.error("password update error", updateError);
      return json({ error: "The code was verified, but the password could not be updated. Request a new code and try again." }, 500);
    }

    return json({ success: true });
  } catch (error) {
    console.error("password-change-otp error", error);
    return json({ error: "Password change could not be completed. Please request a new code and try again." }, 500);
  }
});

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const TARGET = "https://lhizunrljottkhemdfei.supabase.co/functions/v1/strap-auth-email";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.text();
    const headers = new Headers();
    for (const key of ["content-type", "webhook-id", "webhook-timestamp", "webhook-signature"]) {
      const value = req.headers.get(key);
      if (value) headers.set(key, value);
    }

    // Preserve the original signed payload and signature headers. The target
    // endpoint performs the actual Standard Webhooks verification before
    // sending any email, so this legacy URL cannot be used as an open relay.
    const upstream = await fetch(TARGET, { method: "POST", headers, body });
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
    });
  } catch (error) {
    console.error("Signed auth hook relay failed", error instanceof Error ? error.message : String(error));
    return new Response(JSON.stringify({ error: "Authentication email hook unavailable" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
});
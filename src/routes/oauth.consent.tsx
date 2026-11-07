import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/oauth/consent")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Authorize an app — Strap" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: OAuthConsentPage,
});

type ConsentDetails = {
  authorization_id?: string;
  redirect_url?: string;
  client: {
    name: string;
    uri?: string | null;
    logo_uri?: string | null;
  };
  redirect_uri: string;
  scope?: string;
};

function OAuthConsentPage() {
  const navigate = useNavigate();
  const [details, setDetails] = useState<ConsentDetails | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      const authorizationId = new URLSearchParams(window.location.search).get("authorization_id");
      if (!authorizationId || authorizationId.length > 512) {
        setError("This authorization request is missing or invalid. Return to the app and try again.");
        return;
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        sessionStorage.setItem(
          "strap_oauth_return",
          `${window.location.pathname}${window.location.search}`,
        );
        await navigate({ to: "/auth", replace: true });
        return;
      }

      const { data, error: detailsError } =
        await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (detailsError || !data) {
        setError(detailsError?.message ?? "We couldn't verify this authorization request.");
        return;
      }

      const authorization = data as ConsentDetails;
      if (!("authorization_id" in authorization) && authorization.redirect_url) {
        window.location.assign(authorization.redirect_url);
        return;
      }
      setDetails(authorization);
    };

    void load().catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : "Unable to load authorization.");
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  async function decide(decision: "approve" | "deny") {
    if (!details?.authorization_id || busy) return;
    setBusy(true);
    setError("");
    try {
      const response =
        decision === "approve"
          ? await supabase.auth.oauth.approveAuthorization(details.authorization_id)
          : await supabase.auth.oauth.denyAuthorization(details.authorization_id);
      if (response.error) throw response.error;
      const redirectUrl = response.data?.redirect_url;
      if (!redirectUrl) throw new Error("Supabase did not return an authorization redirect.");
      sessionStorage.removeItem("strap_oauth_return");
      window.location.assign(redirectUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your decision could not be saved.");
      setBusy(false);
    }
  }

  const scopes = (details?.scope ?? "").split(/\s+/).filter(Boolean);
  const redirectHost = (() => {
    try {
      return details?.redirect_uri ? new URL(details.redirect_uri).host : "";
    } catch {
      return "Unrecognised redirect destination";
    }
  })();

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <section className="mx-auto w-full max-w-lg rounded-3xl border bg-card p-6 shadow-sm sm:p-9">
        <div className="mb-7 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-foreground text-sm font-bold text-background">
            S
          </span>
          <div>
            <p className="text-sm font-semibold">Strap</p>
            <p className="text-xs text-muted-foreground">Secure account authorization</p>
          </div>
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Third-party access request
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Connect an app to your Strap account</h1>

        {error && (
          <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
            {error}
          </div>
        )}

        {details ? (
          <>
            <div className="mt-6 rounded-2xl border p-4">
              <p className="text-xs text-muted-foreground">Application requesting access</p>
              <p className="mt-1 text-lg font-semibold">{details.client?.name ?? "Unknown application"}</p>
              {details.client?.uri && (
                <p className="mt-1 break-all text-xs text-muted-foreground">{details.client.uri}</p>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                After approval, this application will redirect to <b>{redirectHost}</b>.
              </p>
            </div>

            <div className="mt-6">
              <h2 className="text-sm font-semibold">Requested permissions</h2>
              {scopes.length ? (
                <ul className="mt-3 space-y-2">
                  {scopes.map((scope) => (
                    <li key={scope} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5 text-emerald-600" aria-hidden="true">✓</span>
                      <span>{scope}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  The application has not listed individual OAuth scopes. Review the app name carefully before approving.
                </p>
              )}
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void decide("deny")}
                className="rounded-xl border px-4 py-3 text-sm font-semibold disabled:opacity-50"
              >
                {busy ? "Please wait…" : "Deny access"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void decide("approve")}
                className="rounded-xl bg-foreground px-4 py-3 text-sm font-semibold text-background disabled:opacity-50"
              >
                {busy ? "Please wait…" : "Approve access"}
              </button>
            </div>
          </>
        ) : !error ? (
          <p className="mt-5 text-sm text-muted-foreground" role="status">
            Checking your Strap session and the requesting application…
          </p>
        ) : null}

        <p className="mt-7 text-xs leading-5 text-muted-foreground">
          Only approve applications you recognise. You can deny this request without affecting your Strap account.
        </p>
      </section>
    </main>
  );
}

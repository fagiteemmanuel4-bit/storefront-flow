import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthBrand } from "@/components/auth/AuthBrand";
import "@/strap-auth.css";

export const Route = createFileRoute("/verified")({ ssr: false, component: VerifiedPage });

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/auth";
  return value;
}

function VerifiedPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState("");
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const hash = window.location.hash;
  const kind =
    params.get("kind") ??
    (hash.includes("type=recovery")
      ? "password"
      : hash.includes("type=signup")
        ? "email"
        : "security");
  const next = safeNext(params.get("next"));

  const copy =
    kind === "password"
      ? {
          label: "Password verified",
          title: "You’re cleared to continue.",
          body: "Your secure verification link is valid. Continue to choose your new password.",
          action: "Continue",
        }
      : kind === "email"
        ? {
            label: "Email verified",
            title: "Your email is confirmed.",
            body: "Your account is now verified. You can return to Strap and sign in normally.",
            action: "Continue to Strap",
          }
        : {
            label: "Verified",
            title: "You’re all set.",
            body: "Your security action has been verified successfully.",
            action: "Continue",
          };

  useEffect(() => {
    let active = true;
    const finish = async () => {
      try {
        const code = new URLSearchParams(window.location.search).get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          const cleanUrl = `${window.location.origin}${window.location.pathname}?kind=${encodeURIComponent(kind)}&next=${encodeURIComponent(next)}`;
          window.history.replaceState({}, document.title, cleanUrl);
        } else {
          await new Promise((resolve) => window.setTimeout(resolve, 350));
        }
        if (!active) return;
        const { data } = await supabase.auth.getSession();
        if (!data.session && kind !== "security")
          throw new Error(
            "We couldn't establish the verification session. Please request a fresh link and try again.",
          );
        setReady(true);
      } catch (error) {
        if (!active) return;
        setFailed(
          error instanceof Error
            ? error.message
            : "This verification link is invalid or has expired.",
        );
        setReady(true);
      }
    };
    void finish();
    return () => {
      active = false;
    };
  }, [kind, next]);

  function continueToDestination() {
    void navigate({ to: next as never, replace: true });
  }

  if (failed)
    return (
      <main className="sa">
        <AuthBrand />
        <section className="sa-r">
          <div className="sa-box">
            <div className="sa-ok err">
              <svg
                aria-hidden="true"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </div>
            <h1>We couldn’t verify that link</h1>
            <p className="sa-mut" role="alert">
              {failed}
            </p>
            <div className="sa-fm">
              <button
                type="button"
                className="sa-b p"
                onClick={() => void navigate({ to: "/auth", replace: true })}
              >
                Return to log in
              </button>
            </div>
          </div>
        </section>
      </main>
    );

  return (
    <main className="sa">
      <AuthBrand />
      <section className="sa-r">
        <div className="sa-box">
          <div className="sa-ok">
            <svg
              aria-hidden="true"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0E1116"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12l5 5 9-10" />
            </svg>
          </div>
          <p className="sa-label">{copy.label}</p>
          <h1>{copy.title}</h1>
          <p className="sa-mut" role="status">
            {copy.body}
          </p>
          <div className="sa-fm">
            <div className="sa-notice">
              Your verification was processed securely by Strap and Supabase.
            </div>
            <button
              type="button"
              className="sa-b p"
              onClick={continueToDestination}
              disabled={!ready}
            >
              {ready ? copy.action : "Checking verification…"}
            </button>
          </div>
          <p className="sa-alt">
            <button
              type="button"
              className="sa-lk"
              onClick={() => void navigate({ to: "/auth", replace: true })}
            >
              Exit to log in
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}

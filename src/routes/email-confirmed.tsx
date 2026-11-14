import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AuthBrand } from "@/components/auth/AuthBrand";
import "@/strap-auth.css";
import "@/strap-reference.css";

export const Route = createFileRoute("/email-confirmed")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Email confirmed — Strap" },
      { name: "description", content: "Your Strap email address has been confirmed." },
    ],
  }),
  component: EmailConfirmedPage,
});

function EmailConfirmedPage() {
  const [checking, setChecking] = useState(true);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    let mounted = true;
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) {
        setConfirmed(Boolean(data.session));
        setChecking(false);
      }
    };
    void checkSession();
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        setConfirmed(Boolean(session));
        setChecking(false);
      }
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <main className="sa">
      <AuthBrand />
      <section className="sa-r">
        <div className="sa-box">
          <div className="sa-ok" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="28"
              height="28"
              fill="none"
              stroke="#0a0a0a"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12l5 5 9-10" />
            </svg>
          </div>
          <h1>Email confirmed</h1>
          <p className="sa-mut" role="status">
            {checking
              ? "Confirming your email address…"
              : confirmed
                ? "Your email has been successfully confirmed. Your Strap account is ready to use."
                : "Your confirmation link was opened, but we couldn't establish your session. Please return to login and try again."}
          </p>
          <div className="sa-fm">
            <Button asChild className="sa-b p">
              <Link to="/auth">Go back to login</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

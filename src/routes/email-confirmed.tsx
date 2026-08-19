import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/email-confirmed")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Email confirmed — Kudi" },
      { name: "description", content: "Your Kudi email address has been confirmed." },
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
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="surface-card w-full max-w-md rounded-2xl border p-8 text-center shadow-sm sm:p-10">
        <div className={`mx-auto flex size-24 items-center justify-center rounded-full bg-accent-soft ${checking ? "animate-pulse" : ""}`} aria-hidden="true">
          <div className="flex size-16 items-center justify-center rounded-full bg-accent">
            <svg viewBox="0 0 52 52" className="size-9 text-foreground" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 27.5 22.5 36 39 17" className={checking ? "" : "animate-[draw-check_500ms_ease-out_forwards]"} style={{ strokeDasharray: 40, strokeDashoffset: checking ? 40 : 0 }} />
            </svg>
          </div>
        </div>
        <h1 className="mt-7 text-display-md">Email confirmed</h1>
        <p className="mx-auto mt-3 max-w-sm text-muted-foreground">
          {checking ? "Confirming your email address…" : confirmed ? "Your email has been successfully confirmed. Your Kudi account is ready to use." : "Your confirmation link was opened, but we couldn't establish your session. Please return to login and try again."}
        </p>
        <Button asChild className="mt-8 h-12 w-full rounded-xl">
          <Link to="/auth">Go back to login</Link>
        </Button>
      </div>
      <style>{`@keyframes draw-check { from { stroke-dashoffset: 40; } to { stroke-dashoffset: 0; } }`}</style>
    </main>
  );
}

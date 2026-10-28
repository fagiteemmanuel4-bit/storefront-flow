import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

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
  const kind = params.get("kind") ?? (hash.includes("type=recovery") ? "password" : hash.includes("type=signup") ? "email" : "security");
  const next = safeNext(params.get("next"));

  const copy = kind === "password"
    ? { label: "Password verified", title: "You're cleared to continue.", body: "Your secure verification link is valid. Continue to choose your new password.", action: "Continue" }
    : kind === "email"
      ? { label: "Email verified", title: "Your email is confirmed.", body: "Your account is now verified. You can return to Strap and sign in normally.", action: "Continue to Strap" }
      : { label: "Verified", title: "You're all set.", body: "Your security action has been verified successfully.", action: "Continue" };

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
        if (!data.session && kind !== "security") throw new Error("We couldn't establish the verification session. Please request a fresh link and try again.");
        setReady(true);
      } catch (error) {
        if (!active) return;
        setFailed(error instanceof Error ? error.message : "This verification link is invalid or has expired.");
        setReady(true);
      }
    };
    void finish();
    return () => { active = false; };
  }, [kind, next]);

  function continueToDestination() { void navigate({ to: next as never, replace: true }); }

  if (failed) return <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10"><section className="w-full max-w-md rounded-[2rem] border border-border bg-surface p-7 text-center shadow-float sm:p-9"><div className="mx-auto flex size-20 items-center justify-center rounded-full bg-destructive/10 text-destructive"><XCircle className="size-10" /></div><p className="text-label-caps mt-7 text-destructive">Verification failed</p><h1 className="text-display-md mt-3">We couldn't verify that link.</h1><p className="mt-4 leading-7 text-muted-foreground">{failed}</p><Button className="mt-7 h-12 w-full rounded-xl" onClick={() => void navigate({ to: "/auth", replace: true })}>Return to sign in</Button></section></main>;

  return <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10"><section className="w-full max-w-md rounded-[2rem] border border-border bg-surface p-7 text-center shadow-float sm:p-9"><div className="mx-auto flex size-20 items-center justify-center rounded-full bg-foreground text-background"><CheckCircle2 className="size-10 animate-[verified-pop_500ms_ease-out_both]" strokeWidth={1.8} /></div><p className="text-label-caps mt-7 text-accent-ink">{copy.label}</p><h1 className="text-display-md mt-3">{copy.title}</h1><p className="mt-4 leading-7 text-muted-foreground">{copy.body}</p><div className="mt-7 flex items-start gap-3 rounded-2xl border border-border bg-secondary/60 p-4 text-left"><ShieldCheck className="mt-0.5 size-5 shrink-0" /><p className="text-xs leading-5 text-muted-foreground">Your verification was processed securely by Strap and Supabase.</p></div><Button className="mt-7 h-12 w-full rounded-xl" onClick={continueToDestination} disabled={!ready}>{ready ? copy.action : "Checking verification…"}<ArrowRight className="ml-2 size-4" /></Button><button type="button" onClick={() => void navigate({ to: "/auth", replace: true })} className="mt-4 text-sm font-semibold text-muted-foreground underline underline-offset-4">Exit to sign in</button></section></main>;
}

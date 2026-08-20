import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Clock3, Mail, RefreshCw, ShieldCheck, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/verify-email")({ ssr: false, head: () => ({ meta: [{ title: "Verify your email — Kudi" }, { name: "description", content: "Confirm your email address to finish setting up your Kudi account." }] }), component: VerifyEmailPage });

const RESEND_COOLDOWN_SECONDS = 60;

function VerifyEmailPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/verify-email" }) as { email?: string };
  const [email, setEmail] = useState(search.email || "");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!email) setEmail(sessionStorage.getItem("kudi_otp_email") || "");
    let active = true;
    const finishLink = async () => {
      const params = new URLSearchParams(window.location.search);
      const codeParam = params.get("code");
      const tokenHash = params.get("token_hash");
      if (!codeParam && !tokenHash && !window.location.hash.includes("type=signup")) return;
      setLoading(true);
      try {
        if (codeParam) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(codeParam);
          if (exchangeError) throw exchangeError;
        } else if (tokenHash) {
          const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
          if (verifyError) throw verifyError;
        } else {
          await new Promise((resolve) => window.setTimeout(resolve, 350));
        }
        if (!active) return;
        const { data } = await supabase.auth.getSession();
        if (!data.session) throw new Error("The verification link is invalid or has expired. Request a fresh one below.");
        window.history.replaceState({}, document.title, `${window.location.pathname}?email=${encodeURIComponent(email)}`);
        toast.success("Email verified. Welcome to Kudi!");
        void navigate({ to: "/pos", replace: true });
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "This verification link could not be completed.");
      } finally { if (active) setLoading(false); }
    };
    void finishLink();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const verify = async (event: React.FormEvent) => {
    event.preventDefault(); setError(""); setMessage("");
    const normalizedEmail = email.trim().toLowerCase(); const token = code.replace(/\D/g, "");
    if (!normalizedEmail) return setError("Enter your email address.");
    if (token.length !== 6) return setError("Enter the 6-digit code sent to your email.");
    setLoading(true);
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({ email: normalizedEmail, token, type: "email" });
      if (verifyError) throw verifyError;
      if (!data.session || !data.user) throw new Error("Verification did not create a valid session.");
      sessionStorage.removeItem("kudi_otp_email"); sessionStorage.removeItem("kudi_otp_flow");
      void navigate({ to: "/pos", replace: true });
    } catch (err) { setError(err instanceof Error ? err.message : "The code could not be verified."); } finally { setLoading(false); }
  };

  const resend = async () => {
    if (resending || cooldown > 0) return;
    setError(""); setMessage(""); const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return setError("Enter your email address.");
    setResending(true);
    try {
      const { error: resendError } = await supabase.auth.resend({ type: "signup", email: normalizedEmail, options: { emailRedirectTo: `${window.location.origin}/verified?kind=email&next=${encodeURIComponent("/auth")}` } });
      if (resendError) throw resendError;
      setCooldown(RESEND_COOLDOWN_SECONDS); setMessage("A fresh verification link is on its way. Check your inbox.");
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to send a new verification email."); } finally { setResending(false); }
  };

  return <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10"><form onSubmit={verify} className="w-full max-w-md rounded-[28px] border bg-card p-7 shadow-sm space-y-6"><div className="flex justify-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-muted/40"><Mail className="h-6 w-6" /></div></div><div className="text-center space-y-2"><h1 className="text-2xl font-semibold tracking-tight">Check your email</h1><p className="text-sm leading-6 text-muted-foreground">Open the secure link we sent to <span className="font-medium text-foreground">{email || "your email"}</span>, or enter the 6-digit code below.</p></div>{message && <div className="flex items-start gap-3 rounded-2xl border p-3.5 text-sm" role="status"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{message}</div>}{error && <div className="flex items-start gap-3 rounded-2xl border p-3.5 text-sm" role="alert"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}<div className="space-y-2"><Label htmlFor="verification-email">Email</Label><Input id="verification-email" className="h-12 rounded-2xl" value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" autoComplete="email" /></div><div className="space-y-2"><Label htmlFor="verification-code">Verification code</Label><Input id="verification-code" className="h-14 rounded-2xl text-center text-xl font-semibold tracking-[0.5em]" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" maxLength={6} /></div><Button type="submit" disabled={loading || code.length !== 6} className="h-12 w-full rounded-2xl">{loading ? "Verifying…" : "Verify code"}<ArrowRight className="ml-2 h-4 w-4" /></Button><div className="rounded-2xl border p-4"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><div className="min-w-0 flex-1"><p className="text-sm font-medium">Didn't receive it?</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Check spam or promotions before requesting another link.</p></div></div><button type="button" disabled={resending || cooldown > 0} onClick={() => void resend()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium disabled:opacity-50">{cooldown > 0 ? <Clock3 className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}{resending ? "Sending…" : cooldown > 0 ? `Try again in ${cooldown}s` : "Send a new verification link"}</button></div><button type="button" onClick={() => void navigate({ to: "/auth" })} className="w-full rounded-2xl px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground">Back to sign in</button></form></main>;
}

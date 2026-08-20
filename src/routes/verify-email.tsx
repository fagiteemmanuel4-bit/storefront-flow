import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { CheckCircle2, Clock3, Mail, RefreshCw, ShieldCheck, TriangleAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/verify-email")({
  ssr: false,
  head: () => ({ meta: [{ title: "Verify your email — Kudi" }, { name: "description", content: "Confirm your email address to finish setting up your Kudi account." }] }),
  component: VerifyEmailPage,
});

const RESEND_COOLDOWN_SECONDS = 60;

type VerificationState = "checking" | "waiting" | "success" | "error";

function VerifyEmailPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/verify-email" }) as { email?: string };
  const [email, setEmail] = useState(search.email || "");
  const [state, setState] = useState<VerificationState>("waiting");
  const [message, setMessage] = useState("");
  const [code, setCode] = useState("");
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
      const hasVerificationHash = window.location.hash.includes("type=signup") || window.location.hash.includes("type=email");
      if (!codeParam && !tokenHash && !hasVerificationHash) return;

      setState("checking");
      setMessage("");
      try {
        if (codeParam) {
          const { error } = await supabase.auth.exchangeCodeForSession(codeParam);
          if (error) throw error;
        } else if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
          if (error) throw error;
        } else {
          await new Promise((resolve) => window.setTimeout(resolve, 350));
        }

        const { data } = await supabase.auth.getUser();
        if (!data.user?.email_confirmed_at) throw new Error("Your email could not be confirmed. The link may have expired.");

        // The confirmation link may establish a temporary session. Do not leave
        // a newly verified merchant signed in automatically: the product contract
        // is to confirm first, then return them to the normal login flow.
        await supabase.auth.signOut();
        sessionStorage.removeItem("kudi_otp_email");
        sessionStorage.removeItem("kudi_otp_flow");
        window.history.replaceState({}, document.title, `${window.location.pathname}?email=${encodeURIComponent(email)}`);
        if (active) {
          setState("success");
          setMessage("Your account is verified — you can now log in.");
        }
      } catch (error) {
        if (!active) return;
        setState("error");
        setMessage(error instanceof Error ? error.message : "This verification link is invalid or has expired. Request a fresh verification email below.");
      }
    };
    void finishLink();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const verifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return setMessage("Enter your email address.");
    if (code.replace(/\D/g, "").length !== 6) return setMessage("Enter the 6-digit code sent to your email.");
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({ email: normalizedEmail, token: code.replace(/\D/g, ""), type: "email" });
      if (error) throw error;
      if (!data.user?.email_confirmed_at) throw new Error("Verification did not complete. Please request a fresh code.");
      await supabase.auth.signOut();
      sessionStorage.removeItem("kudi_otp_email");
      setState("success");
      setMessage("Your account is verified — you can now log in.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "The code could not be verified.");
    } finally { setLoading(false); }
  };

  const resend = async () => {
    if (resending || cooldown > 0) return;
    setMessage("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return setMessage("Enter your email address first.");
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email: normalizedEmail, options: { emailRedirectTo: `${window.location.origin}/verify-email?email=${encodeURIComponent(normalizedEmail)}` } });
      if (error) throw error;
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setState("waiting");
      setMessage("A fresh verification email is on its way. Check your inbox, spam, and promotions folders.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "We couldn't send a new verification email. Please try again later.");
    } finally { setResending(false); }
  };

  const success = state === "success";
  const checking = state === "checking";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-md rounded-[28px] border bg-card p-7 shadow-sm sm:p-10">
        <div className="flex justify-center">
          <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${success ? "bg-accent-soft" : "bg-muted/40"}`}>
            {success ? <CheckCircle2 className="h-7 w-7" /> : checking ? <ShieldCheck className="h-7 w-7 animate-pulse" /> : <Mail className="h-7 w-7" />}
          </div>
        </div>

        <div className="mt-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {success ? "Email verified" : checking ? "Confirming your email" : state === "error" ? "We couldn't verify that" : "Check your email"}
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
            {success ? message : checking ? "We're securely confirming the link. This should only take a moment." : "Open the secure verification link we sent to your email. You can also enter the 6-digit code if your email provider shows it."}
          </p>
        </div>

        {message && !success && !checking && (
          <div className={`mt-6 flex items-start gap-3 rounded-2xl border p-3.5 text-sm ${state === "error" ? "bg-destructive/5" : "bg-secondary/50"}`} role={state === "error" ? "alert" : "status"}>
            {state === "error" ? <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
            <span>{message}</span>
          </div>
        )}

        {!success && !checking && (
          <>
            <form onSubmit={verifyCode} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verification-email">Email</Label>
                <Input id="verification-email" className="h-12 rounded-2xl" value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" autoComplete="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="verification-code">Verification code</Label>
                <Input id="verification-code" className="h-14 rounded-2xl text-center text-xl font-semibold tracking-[0.5em]" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" maxLength={6} />
              </div>
              <Button type="submit" disabled={loading || code.length !== 6} className="h-12 w-full rounded-2xl">{loading ? "Verifying…" : "Verify email"}</Button>
            </form>

            <div className="mt-5 rounded-2xl border p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                <div><p className="text-sm font-medium">Didn't receive it?</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Check spam or promotions. If the message bounced, use a working email address or contact Kudi support.</p></div>
              </div>
              <button type="button" disabled={resending || cooldown > 0} onClick={() => void resend()} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium disabled:opacity-50">
                {cooldown > 0 ? <Clock3 className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                {resending ? "Sending…" : cooldown > 0 ? `Try again in ${cooldown}s` : "Resend verification email"}
              </button>
            </div>
          </>
        )}

        <Button asChild variant={success ? "default" : "outline"} className="mt-6 h-12 w-full rounded-2xl">
          <Link to="/auth">{success ? "Go to login" : "Back to login"}</Link>
        </Button>
      </div>
    </main>
  );
}

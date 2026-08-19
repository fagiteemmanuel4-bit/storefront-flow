import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { CheckCircle2, Clock3, Mail, ShieldCheck, TriangleAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/verify-email")({ component: VerifyEmailPage });

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
  }, [email]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    const normalizedEmail = email.trim().toLowerCase();
    const token = code.replace(/\D/g, "");

    if (!normalizedEmail) return setError("Enter your email address.");
    if (token.length !== 6) return setError("Enter the 6-digit code sent to your email.");

    setLoading(true);
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token,
        type: "email",
      });
      if (verifyError) throw verifyError;
      if (!data.session || !data.user) throw new Error("Verification did not create a valid session.");

      sessionStorage.removeItem("kudi_otp_email");
      sessionStorage.removeItem("kudi_otp_flow");
      navigate({ to: "/pos" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "The code could not be verified.");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (resending || cooldown > 0) return;
    setError("");
    setMessage("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return setError("Enter your email address.");

    setResending(true);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: { shouldCreateUser: false },
      });
      if (otpError) throw otpError;

      setCooldown(RESEND_COOLDOWN_SECONDS);
      setMessage("A new verification code is on its way. Check your inbox.");
    } catch (err) {
      const text = err instanceof Error ? err.message : "Unable to send a new code.";
      if (/rate limit|too many|email rate/i.test(text)) {
        setError("Too many email requests. Please wait a little before requesting another code.");
        setCooldown(RESEND_COOLDOWN_SECONDS);
      } else {
        setError(text);
      }
    } finally {
      setResending(false);
    }
  };

  const displayEmail = email.trim().toLowerCase();

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-5 py-10">
      <form onSubmit={verify} className="w-full max-w-md rounded-[28px] border bg-card p-7 shadow-sm space-y-6">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-muted/40">
            <Mail className="h-6 w-6" aria-hidden="true" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Enter the 6-digit code we sent to <span className="font-medium text-foreground">{displayEmail || "your email"}</span>.
          </p>
        </div>

        {message && (
          <div className="flex items-start gap-3 rounded-2xl border p-3.5 text-sm" role="status">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border p-3.5 text-sm" role="alert">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="verification-email" className="text-sm font-medium">Email</label>
          <input
            id="verification-email"
            className="w-full rounded-2xl border bg-background px-4 py-3 outline-none transition focus:ring-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="verification-code" className="text-sm font-medium">Verification code</label>
          <input
            id="verification-code"
            className="w-full rounded-2xl border bg-background px-4 py-4 text-center text-xl font-semibold tracking-[0.5em] outline-none transition focus:ring-2"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            maxLength={6}
          />
        </div>

        <button
          disabled={loading || code.length !== 6}
          className="w-full rounded-2xl border px-4 py-3.5 font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Verifying…" : "Verify code"}
        </button>

        <div className="rounded-2xl border p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Didn't receive it?</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Check spam or promotions before requesting another code.</p>
            </div>
          </div>
          <button
            type="button"
            disabled={resending || cooldown > 0}
            onClick={resend}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cooldown > 0 ? <Clock3 className="h-4 w-4" aria-hidden="true" /> : null}
            {resending ? "Sending…" : cooldown > 0 ? `Try again in ${cooldown}s` : "Send a new code"}
          </button>
        </div>

        <button type="button" onClick={() => navigate({ to: "/login" })} className="w-full rounded-2xl px-4 py-2.5 text-sm text-muted-foreground transition hover:text-foreground">
          Back to login
        </button>
      </form>
    </main>
  );
}

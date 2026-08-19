import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/verify-email")({ component: VerifyEmailPage });

function VerifyEmailPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/verify-email" }) as { email?: string };
  const [email, setEmail] = useState(search.email || "");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!email) setEmail(sessionStorage.getItem("kudi_otp_email") || "");
  }, [email]);

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
      const { data, error: verifyError } = await supabase.auth.verifyOtp({ email: normalizedEmail, token, type: "email" });
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
    setError("");
    setMessage("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return setError("Enter your email address.");
    setResending(true);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({ email: normalizedEmail, options: { shouldCreateUser: false } });
      if (otpError) throw otpError;
      setMessage("A new verification code has been sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send a new code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={verify} className="w-full max-w-md rounded-3xl border p-8 space-y-5">
        <div><h1 className="text-2xl font-semibold">Verify your email</h1><p className="text-sm text-muted-foreground mt-1">Enter the 6-digit code we sent to your email.</p></div>
        {error && <div className="rounded-2xl border p-3 text-sm text-destructive">{error}</div>}
        {message && <div className="rounded-2xl border p-3 text-sm">{message}</div>}
        <input className="w-full rounded-2xl border px-4 py-3" value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email address" autoComplete="email" />
        <input className="w-full rounded-2xl border px-4 py-3 text-center tracking-[0.5em]" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" maxLength={6} />
        <button disabled={loading} className="w-full rounded-2xl border px-4 py-3 font-medium disabled:opacity-50">{loading ? "Verifying…" : "Verify email"}</button>
        <button type="button" disabled={resending} onClick={resend} className="w-full rounded-2xl border px-4 py-3 text-sm disabled:opacity-50">{resending ? "Sending…" : "Send a new code"}</button>
        <button type="button" onClick={() => navigate({ to: "/login" })} className="w-full rounded-2xl px-4 py-3 text-sm">Back to login</button>
      </form>
    </main>
  );
}

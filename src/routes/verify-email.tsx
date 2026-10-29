import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { CheckCircle2, Clock3, Mail, RefreshCw, ShieldCheck, TriangleAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/verify-email")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Verify your email — Strap" },
      {
        name: "description",
        content: "Confirm your email with a secure one-time code to access Strap.",
      },
    ],
  }),
  component: VerifyEmailPage,
});

const RESEND_COOLDOWN_SECONDS = 60;
// Supabase is currently configured to send an 8-digit email OTP for Strap.
const OTP_LENGTH = 8;
type VerificationState = "checking" | "waiting" | "verifying" | "success" | "error";

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
  const [flow, setFlow] = useState<"signup" | "signin">("signin");
  const verifyingRef = useRef(false);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("strap_otp_email");
    const storedFlow = sessionStorage.getItem("strap_otp_flow");
    if (!email && storedEmail) setEmail(storedEmail);
    if (storedFlow === "signup" || storedFlow === "signin") setFlow(storedFlow);

    let active = true;
    const finishLink = async () => {
      const params = new URLSearchParams(window.location.search);
      const codeParam = params.get("code");
      const tokenHash = params.get("token_hash");
      const hasVerificationHash =
        window.location.hash.includes("type=signup") || window.location.hash.includes("type=email");
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
        } else await new Promise((resolve) => window.setTimeout(resolve, 350));
        const { data } = await supabase.auth.getUser();
        if (!data.user?.email_confirmed_at)
          throw new Error(
            "Your email could not be confirmed. The verification link may have expired.",
          );
        if (!active) return;
        sessionStorage.removeItem("strap_otp_email");
        sessionStorage.removeItem("strap_otp_flow");
        setState("success");
        setMessage(
          flow === "signup"
            ? "Your email is verified. Your Strap account is ready."
            : "Your sign-in is verified. Opening Strap…",
        );
        if (flow === "signin") {
          window.setTimeout(() => void navigate({ to: "/pos", replace: true }), 450);
        } else {
          await supabase.auth.signOut();
        }
      } catch (error) {
        if (!active) return;
        setState("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "This verification link is invalid or has expired. Request a fresh code below.",
        );
      }
    };
    void finishLink();
    return () => {
      active = false;
    };
  }, [email, flow, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const verifyCode = async (event?: React.FormEvent, suppliedCode?: string) => {
    event?.preventDefault();
    if (verifyingRef.current || loading) return;
    setMessage("");
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = (suppliedCode ?? code).replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!normalizedEmail) {
      setState("error");
      setMessage("Enter your email address.");
      return;
    }
    if (normalizedCode.length !== OTP_LENGTH) {
      setState("waiting");
      setMessage(`Enter the ${OTP_LENGTH}-digit code sent to your email.`);
      return;
    }

    verifyingRef.current = true;
    setLoading(true);
    setState("verifying");
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: normalizedCode,
        type: "email",
      });
      if (error) throw error;
      if (!data.user?.email_confirmed_at)
        throw new Error(
          "The code was accepted, but your email is not confirmed yet. Please request a fresh code.",
        );

      sessionStorage.removeItem("strap_otp_email");
      sessionStorage.removeItem("strap_otp_flow");
      setCode("");
      setState("success");
      setMessage(
        flow === "signup"
          ? "Email verified successfully. Your account is ready."
          : "Email verified successfully. Opening Strap…",
      );

      if (flow === "signin") {
        await navigate({ to: "/pos", replace: true });
      } else {
        await supabase.auth.signOut();
      }
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "The code could not be verified. Request a fresh code and try again.",
      );
      setCode("");
    } finally {
      setLoading(false);
      verifyingRef.current = false;
    }
  };

  const resend = async () => {
    if (resending || cooldown > 0) return;
    setMessage("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setState("error");
      setMessage("Enter your email address first.");
      return;
    }
    setResending(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/verify-email?email=${encodeURIComponent(normalizedEmail)}`,
        },
      });
      if (error) throw error;
      sessionStorage.setItem("strap_otp_email", normalizedEmail);
      sessionStorage.setItem("strap_otp_flow", flow);
      setCode("");
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setState("waiting");
      setMessage(
        "A fresh one-time code is on its way. Check your inbox, spam, and promotions folders.",
      );
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "We couldn't send a new code. Please try again later.",
      );
    } finally {
      setResending(false);
    }
  };

  const success = state === "success";
  const checking = state === "checking";
  const verifying = state === "verifying";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-lift sm:p-8">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50">
            {success ? (
              <CheckCircle2 className="h-6 w-6" />
            ) : checking || verifying ? (
              <ShieldCheck className="h-6 w-6 animate-pulse" />
            ) : (
              <Mail className="h-6 w-6" />
            )}
          </div>
          <h1 className="mt-4 text-xl font-semibold tracking-tight">
            {success
              ? "Email verified"
              : checking
                ? "Confirming email…"
                : verifying
                  ? "Checking code…"
                  : "Verify your email"}
          </h1>
          <p className="mt-2 text-sm leading-5 text-muted-foreground">
            {success ? (
              message
            ) : checking ? (
              "Please wait a moment."
            ) : verifying ? (
              "Just a moment while we check your code."
            ) : (
              <>
                Enter the 8-digit code sent to{" "}
                <span className="font-medium text-foreground">{email || "your email address"}</span>
                .
              </>
            )}
          </p>
        </div>

        {message && !success && !checking && !verifying && (
          <p
            className={`mt-4 rounded-xl px-3 py-2.5 text-sm ${state === "error" ? "bg-destructive/10 text-destructive" : "bg-secondary text-muted-foreground"}`}
            role={state === "error" ? "alert" : "status"}
          >
            {message}
          </p>
        )}

        {!success && !checking && (
          <form onSubmit={(event) => void verifyCode(event)} className="mt-5 space-y-3">
            <Input
              id="verification-code"
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              className="h-14 rounded-2xl text-center text-2xl font-semibold tracking-[0.35em]"
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))
              }
              disabled={verifying || loading}
              placeholder="••••••••"
              maxLength={OTP_LENGTH}
              aria-label="8-digit verification code"
            />
            <Button
              type="submit"
              disabled={loading || code.length !== OTP_LENGTH}
              className="h-11 w-full rounded-2xl"
            >
              {loading ? "Verifying…" : "Verify email"}
            </Button>
          </form>
        )}

        {!success && !checking && (
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">Can’t find it? Check your spam folder.</p>
            <button
              type="button"
              disabled={resending || cooldown > 0 || loading}
              onClick={() => void resend()}
              className="mt-2 inline-flex min-h-9 items-center justify-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resending
                ? "Sending new code…"
                : cooldown > 0
                  ? `Resend code in ${cooldown}s`
                  : "Resend code"}
            </button>
          </div>
        )}

        <div className="mt-5 text-center">
          <Link
            to="/auth"
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            {success ? (flow === "signup" ? "Go to login" : "Return to Strap") : "Back to login"}
          </Link>
        </div>
      </div>
    </main>
  );
}

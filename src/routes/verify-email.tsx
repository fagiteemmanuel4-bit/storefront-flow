import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AuthBrand } from "@/components/auth/AuthBrand";
import "@/strap-auth.css";

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
  const boxRefs = useRef<(HTMLInputElement | null)[]>([]);

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
  const boxes = Array.from({ length: OTP_LENGTH }, (_, i) => code[i] ?? "");
  const focusBox = (i: number) =>
    boxRefs.current[Math.max(0, Math.min(OTP_LENGTH - 1, i))]?.focus();
  const setBox = (i: number, raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (!digits) {
      setCode(code.slice(0, i) + code.slice(i + 1));
      return;
    }
    const next = (code.slice(0, i) + digits + code.slice(i + 1)).slice(0, OTP_LENGTH);
    setCode(next);
    focusBox(Math.min(i + digits.length, OTP_LENGTH - 1));
  };

  return (
    <main className="sa">
      <AuthBrand />
      <section className="sa-r">
        <div className="sa-box">
          {success ? (
            <div>
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
              <h1>You’re verified</h1>
              <p className="sa-mut" role="status">
                {message}
              </p>
              <p className="sa-alt">
                <Link to="/auth" className="sa-b p">
                  {flow === "signup" ? "Go to log in" : "Return to Strap"}
                </Link>
              </p>
            </div>
          ) : checking ? (
            <div>
              <h1>Confirming email…</h1>
              <p className="sa-mut" role="status">
                Please wait a moment.
              </p>
            </div>
          ) : (
            <div>
              <h1>{verifying ? "Checking code…" : "Check your email"}</h1>
              <p className="sa-mut">
                We sent a {OTP_LENGTH}-digit code to <b>{email || "your email address"}</b>.{" "}
                <Link to="/auth" className="sa-lk">
                  Change email
                </Link>
              </p>
              <form onSubmit={(event) => void verifyCode(event)} className="sa-fm">
                <div
                  className="sa-otp"
                  role="group"
                  aria-label={`${OTP_LENGTH}-digit verification code`}
                >
                  {boxes.map((digit, i) => (
                    <span key={i} style={{ display: "contents" }}>
                      {i === OTP_LENGTH / 2 && <span className="sep" aria-hidden="true" />}
                      <input
                        ref={(el) => {
                          boxRefs.current[i] = el;
                        }}
                        id={i === 0 ? "verification-code" : undefined}
                        className={`sa-in${digit ? " filled" : ""}`}
                        value={digit}
                        inputMode="numeric"
                        autoComplete={i === 0 ? "one-time-code" : "off"}
                        autoFocus={i === 0}
                        disabled={verifying || loading}
                        aria-label={`Digit ${i + 1} of ${OTP_LENGTH}`}
                        onChange={(event) => setBox(i, event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Backspace" && !digit && i > 0) {
                            event.preventDefault();
                            setCode(code.slice(0, i - 1) + code.slice(i));
                            focusBox(i - 1);
                          } else if (event.key === "ArrowLeft") focusBox(i - 1);
                          else if (event.key === "ArrowRight") focusBox(i + 1);
                        }}
                        onFocus={(event) => event.target.select()}
                      />
                    </span>
                  ))}
                </div>
                {message && (
                  <div
                    className={`sa-notice${state === "error" ? " err" : ""}`}
                    role={state === "error" ? "alert" : "status"}
                  >
                    {message}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading || code.length !== OTP_LENGTH}
                  className="sa-b p"
                >
                  {loading ? "Verifying…" : "Verify and continue"}
                </button>
              </form>
              <p className="sa-alt">
                Didn’t get the code?{" "}
                <button
                  type="button"
                  disabled={resending || cooldown > 0 || loading}
                  onClick={() => void resend()}
                  className="sa-lk"
                >
                  {resending
                    ? "Sending new code…"
                    : cooldown > 0
                      ? `Resend code in ${cooldown}s`
                      : "Resend code"}
                </button>
              </p>
              <p className="sa-alt" style={{ fontSize: 14 }}>
                Check your spam folder too.
              </p>
              <p className="sa-alt">
                <Link to="/auth">Back to log in</Link>
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

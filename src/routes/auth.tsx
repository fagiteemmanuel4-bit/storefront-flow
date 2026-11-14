import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { errorMessage } from "@/lib/format";
import { TurnstileCaptcha } from "@/components/auth/TurnstileCaptcha";
import "@/strap-reference.css";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in or create your shop — Strap" },
      { name: "description", content: "Sign in to Strap or create an account for your shop." },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "reset" | "recover";
const emailSchema = z.string().trim().email("Enter a valid email address").max(255);
const passwordSchema = z.string().min(8, "Use at least 8 characters").max(72);
const nameSchema = z.string().trim().min(2, "Enter your full name").max(120);

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}
function verificationUrl(email?: string) {
  return `${window.location.origin}/verify-email${email ? `?email=${encodeURIComponent(email)}` : ""}`;
}
async function requestLoginOtp(email: string, captchaToken?: string | null) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: verificationUrl(email),
      captchaToken: captchaToken ?? undefined,
    },
  });
  if (error) throw new Error(error.message);
}

function Brand() {
  return (
    <section className="ref-hero">
      <svg className="ref-logo" viewBox="0 0 136 136" aria-label="Strap logo">
        <circle cx="68" cy="68" r="65" fill="none" stroke="#0a0a0a" strokeWidth="3" />
        <circle cx="68" cy="68" r="49" fill="#0a0a0a" />
        <circle cx="68" cy="68" r="19" fill="#e6f53a" />
      </svg>
      <h1>Strap</h1>
      <p className="ref-tagline">Run your business. Not around it.</p>
    </section>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(() => {
    if (typeof window === "undefined") return "signin";
    const params = new URLSearchParams(window.location.search);
    return params.get("mode") === "signup"
      ? "signup"
      : params.get("mode") === "recover" || window.location.hash.includes("type=recovery")
        ? "recover"
        : "signin";
  });
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(() =>
    typeof window === "undefined"
      ? ""
      : (new URLSearchParams(window.location.search).get("email") ?? ""),
  );
  const [password, setPassword] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [recoveryVerified, setRecoveryVerified] = useState(false);
  const [googleOnlyRecovery, setGoogleOnlyRecovery] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleTimer = useRef<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [pendingOtpEmail, setPendingOtpEmail] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (googleTimer.current !== null) window.clearTimeout(googleTimer.current);
    },
    [],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "recover" || window.location.hash.includes("type=recovery")) {
      setMode("recover");
      const recoveryEmail = params.get("email");
      if (recoveryEmail) setEmail(recoveryEmail);
      return;
    }
    let cancelled = false;
    void supabase.auth.getUser().then(({ data }) => {
      if (cancelled || !data.user) return;
      const oauthReturn = sessionStorage.getItem("strap_oauth_return");
      if (oauthReturn?.startsWith("/oauth/consent?authorization_id=")) {
        void navigate({ to: oauthReturn as never, replace: true });
      } else {
        void navigate({ to: "/pos", replace: true });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  function resetCaptcha() {
    setCaptchaToken(null);
    setCaptchaResetKey((value) => value + 1);
  }

  async function handleGoogleSignIn() {
    if (busy || googleLoading) return;
    setGoogleLoading(true);
    setNotice(null);
    googleTimer.current = window.setTimeout(() => {
      googleTimer.current = null;
      setGoogleLoading(false);
      toast.error("Google sign-in is taking too long. Please check your connection and try again.");
    }, 20000);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth` },
      });
      if (error) throw error;
    } catch (error) {
      if (googleTimer.current !== null) {
        window.clearTimeout(googleTimer.current);
        googleTimer.current = null;
      }
      setGoogleLoading(false);
      toast.error(errorMessage(error, "Google sign-in could not be started. Please try again."));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode !== "recover" && !captchaToken) {
      toast.error("Complete the security check before continuing.");
      return;
    }

    if (pendingOtpEmail) {
      setBusy(true);
      try {
        await requestLoginOtp(pendingOtpEmail, captchaToken);
        sessionStorage.setItem("strap_otp_email", pendingOtpEmail);
        sessionStorage.setItem("strap_otp_flow", "signin");
        await navigate({ to: "/verify-email", search: { email: pendingOtpEmail }, replace: true });
      } catch (error) {
        toast.error(errorMessage(error, "We couldn't send your verification code."));
        resetCaptcha();
      } finally {
        setBusy(false);
      }
      return;
    }

    if (mode !== "recover") {
      const parsedEmail = emailSchema.safeParse(normalizeEmail(email));
      if (!parsedEmail.success) {
        toast.error(parsedEmail.error.issues[0]!.message);
        return;
      }
      const normalizedEmail = parsedEmail.data;

      if (mode === "reset") {
        setBusy(true);
        setNotice(null);
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
            redirectTo: `${window.location.origin}/auth?mode=recover&email=${encodeURIComponent(normalizedEmail)}`,
            captchaToken: captchaToken ?? undefined,
          });
          if (error) throw new Error(error.message);
          sessionStorage.setItem("strap_password_recovery_email", normalizedEmail);
          setEmail(normalizedEmail);
          setRecoveryCode("");
          setRecoveryVerified(false);
          setGoogleOnlyRecovery(false);
          setPassword("");
          setMode("recover");
          setNotice(
            "If an account exists for this email, a secure verification code has been sent. Enter it below, then create a password for this same Strap account. If you originally joined with Google, this adds password sign-in without creating another account.",
          );
        } catch (error) {
          toast.error(errorMessage(error, "We couldn't send a password verification code."));
        } finally {
          setBusy(false);
        }
        return;
      }

      const parsedPassword = passwordSchema.safeParse(password);
      if (!parsedPassword.success) {
        toast.error(parsedPassword.error.issues[0]!.message);
        return;
      }

      let validatedName: string | undefined;
      if (mode === "signup") {
        const parsedName = nameSchema.safeParse(fullName);
        if (!parsedName.success) {
          toast.error(parsedName.error.issues[0]!.message);
          return;
        }
        validatedName = parsedName.data;
        if (!accepted) {
          toast.error("Please accept the Terms and Privacy Policy to continue.");
          return;
        }
      }

      setBusy(true);
      setNotice(null);
      try {
        if (mode === "signup") {
          const { data, error } = await supabase.auth.signUp({
            email: normalizedEmail,
            password: parsedPassword.data,
            options: {
              emailRedirectTo: verificationUrl(normalizedEmail),
              data: { full_name: validatedName },
              captchaToken: captchaToken ?? undefined,
            },
          });
          if (error) {
            const message = error.message.toLowerCase();
            if (message.includes("already registered") || message.includes("already exists")) {
              setEmail(normalizedEmail);
              setMode("signin");
              setPassword("");
              setNotice(
                "We couldn't create a new account with that email. If you already use Strap, sign in with your original method. If you joined with Google and want password sign-in, choose Forgot password to add a password to the same account.",
              );
              return;
            }
            throw new Error(error.message);
          }
          if (!data.user) throw new Error("Strap couldn't create the account. Please try again.");
          if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
            setEmail(normalizedEmail);
            setPassword("");
            setMode("signin");
            setNotice(
              "We couldn't create a new account with that email. If you already use Strap, sign in with your original method. If you joined with Google and want password sign-in, choose Forgot password to add a password to the same account.",
            );
            return;
          }
          sessionStorage.setItem("strap_otp_email", normalizedEmail);
          sessionStorage.setItem("strap_otp_flow", "signup");
          await navigate({
            to: "/verify-email",
            search: { email: normalizedEmail },
            replace: true,
          });
          return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: parsedPassword.data,
          options: { captchaToken: captchaToken ?? undefined },
        });
        if (error) {
          if (error.message.toLowerCase().includes("email not confirmed")) {
            setPendingOtpEmail(normalizedEmail);
            resetCaptcha();
            setNotice(
              "Your password is correct. Complete the security check again, then send your sign-in code.",
            );
            return;
          }
          throw new Error(error.message);
        }
        if (!data.session || !data.user)
          throw new Error("Sign in did not complete. Please try again.");

        const deviceToken = localStorage.getItem("strap_trusted_device_token");
        if (deviceToken) {
          const { data: deviceStatus, error: deviceError } = await supabase.functions.invoke(
            "trusted-device",
            { body: { action: "check", token: deviceToken } },
          );
          if (!deviceError && deviceStatus?.trusted === true) {
            if (deviceStatus.risk === "medium")
              toast.message("New network detected. Your device is still recognized.");
            toast.success("Welcome back to Strap!");
            void navigate({ to: "/dashboard", replace: true });
            return;
          }
          if (deviceError)
            console.warn("Trusted-device check failed; requiring email verification.");
        }

        await supabase.auth.signOut();
        setPendingOtpEmail(normalizedEmail);
        resetCaptcha();
        setNotice(
          "This device needs an email verification. Complete the security check again, then send your sign-in code.",
        );
      } catch (error) {
        toast.error(
          errorMessage(error, "That didn't work. Please check your details and try again."),
        );
        resetCaptcha();
      } finally {
        setBusy(false);
      }
      return;
    }

    const parsedEmail = emailSchema.safeParse(normalizeEmail(email));
    if (!parsedEmail.success) {
      toast.error("Enter the email address where you received the verification code.");
      return;
    }
    const normalizedEmail = parsedEmail.data;
    if (!recoveryVerified) {
      if (!/^\d{8}$/.test(recoveryCode)) {
        toast.error("Enter the 8-digit password verification code from your email.");
        return;
      }
      setBusy(true);
      setNotice(null);
      try {
        const { data: recovery, error: verifyError } = await supabase.auth.verifyOtp({
          email: normalizedEmail,
          token: recoveryCode,
          type: "recovery",
        });
        if (verifyError) throw new Error(verifyError.message);
        if (!recovery.user) throw new Error("We couldn't verify that code. Request a fresh one.");
        const providers = Array.isArray(recovery.user.app_metadata?.providers)
          ? recovery.user.app_metadata.providers
          : [];
        const isGoogleOnly = providers.includes("google") && !providers.includes("email");
        setGoogleOnlyRecovery(isGoogleOnly);
        setRecoveryVerified(true);
        setRecoveryCode("");
        setNotice(
          isGoogleOnly
            ? "This account was created with Google and doesn't have a password yet. Create a password now to connect email-and-password sign-in to this same Strap account."
            : "Your email is verified. Create your new password below to finish the password update.",
        );
      } catch (error) {
        toast.error(errorMessage(error, "We couldn't verify that code. Check it and try again."));
      } finally {
        setBusy(false);
      }
      return;
    }

    const parsedPassword = passwordSchema.safeParse(password);
    if (!parsedPassword.success) {
      toast.error(parsedPassword.error.issues[0]!.message);
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: parsedPassword.data });
      if (error) throw new Error(error.message);
      await supabase.auth.signOut();
      sessionStorage.removeItem("strap_password_recovery_email");
      setNotice(
        googleOnlyRecovery
          ? "Password created and connected to your Google-linked email. You can now sign in to this same Strap account with Google or with your email and new password."
          : "Your password has been updated successfully. You can now sign in with your email and new password.",
      );
      setPassword("");
      setRecoveryCode("");
      setRecoveryVerified(false);
      setMode("signin");
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't save your password. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  const title =
    mode === "signin"
      ? "Continue with email"
      : mode === "signup"
        ? "Create your account"
        : mode === "reset"
          ? "Reset your password"
          : recoveryVerified
            ? "Create a new password"
            : "Enter your code";
  const subtitle =
    mode === "signin"
      ? "Welcome back. Enter your details to continue."
      : mode === "signup"
        ? "Set up your shop in a few minutes."
        : mode === "reset"
          ? "Enter your account email and we'll send you an 8-digit code."
          : recoveryVerified
            ? "Your email is verified. Choose a new password."
            : "Enter the 8-digit password verification code sent to your email.";
  const submitLabel = busy
    ? "Please wait…"
    : pendingOtpEmail
      ? "Send verification code"
      : mode === "signin"
        ? "Continue with email"
        : mode === "signup"
          ? "Create account"
          : mode === "reset"
            ? "Send verification code"
            : recoveryVerified
              ? "Update password"
              : "Verify code";
  const showGoogle = mode === "signin" || mode === "signup";
  const showPasswordField =
    mode === "signin" || mode === "signup" || (mode === "recover" && recoveryVerified);
  const needsCaptcha = mode !== "recover";

  return (
    <main className="ref-screen">
      <Brand />
      <section className="ref-sheet">
        <div className="ref-sheet-inner">
          <div className="ref-heading">
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>

          {showGoogle && (
            <>
              <button
                type="button"
                className="ref-btn ref-ghost"
                disabled={busy || googleLoading}
                onClick={() => void handleGoogleSignIn()}
              >
                {googleLoading ? (
                  <LoaderCircle className="animate-spin" size={20} />
                ) : (
                  <GoogleMark />
                )}
                {googleLoading ? "Connecting to Google…" : "Continue with Google"}
              </button>
              <div className="ref-or">or</div>
            </>
          )}

          <form
            className="ref-form"
            onSubmit={(event) => void handleSubmit(event)}
            aria-busy={busy || googleLoading}
          >
            {mode === "signup" && (
              <div className="ref-group">
                <input
                  className="ref-field"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  autoComplete="name"
                  placeholder="Full name"
                  aria-label="Full name"
                  required
                />
              </div>
            )}
            {(mode !== "recover" || !recoveryVerified) && (
              <div className="ref-group">
                <input
                  className="ref-field"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="example@email"
                  aria-label="Email address"
                  required
                />
              </div>
            )}
            {mode === "recover" && !recoveryVerified && (
              <div className="ref-group">
                <input
                  className="ref-field"
                  value={recoveryCode}
                  onChange={(event) =>
                    setRecoveryCode(event.target.value.replace(/\D/g, "").slice(0, 8))
                  }
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={8}
                  placeholder="8-digit verification code"
                  aria-label="8-digit verification code"
                  required
                />
              </div>
            )}
            {showPasswordField && (
              <div className="ref-group">
                {mode === "signin" && (
                  <button
                    type="button"
                    className="ref-link ref-forgot"
                    onClick={() => {
                      setMode("reset");
                      setNotice(null);
                    }}
                  >
                    Forgot password?
                  </button>
                )}
                <div className="ref-password">
                  <input
                    className="ref-field"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    placeholder={mode === "signin" ? "Password" : "Create a password"}
                    aria-label={mode === "signin" ? "Password" : "New password"}
                    required
                  />
                  <button
                    type="button"
                    className="ref-eye"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                  </button>
                </div>
              </div>
            )}
            {mode === "signup" && (
              <label className="ref-terms">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(event) => setAccepted(event.target.checked)}
                />
                <span>
                  I agree to the <Link to="/terms">Terms</Link> and{" "}
                  <Link to="/privacy">Privacy Policy</Link>.
                </span>
              </label>
            )}
            {needsCaptcha && (
              <div className="ref-captcha">
                <TurnstileCaptcha key={captchaResetKey} onTokenChange={setCaptchaToken} />
              </div>
            )}
            {notice && (
              <div className="ref-notice" role="status">
                {notice}
              </div>
            )}
            <button
              type="submit"
              className="ref-btn ref-primary"
              disabled={busy || googleLoading || (mode !== "recover" && !captchaToken)}
            >
              {busy ? <LoaderCircle className="animate-spin" size={18} /> : null}
              {submitLabel}
            </button>
          </form>

          {mode === "signin" && (
            <p className="ref-links">
              New to Strap?{" "}
              <button
                type="button"
                className="ref-link"
                onClick={() => {
                  setMode("signup");
                  setPendingOtpEmail(null);
                  setNotice(null);
                  resetCaptcha();
                }}
              >
                Create an account
              </button>
            </p>
          )}
          {mode === "signup" && (
            <p className="ref-links">
              Already have an account?{" "}
              <button
                type="button"
                className="ref-link"
                onClick={() => {
                  setMode("signin");
                  setNotice(null);
                  resetCaptcha();
                }}
              >
                Log in
              </button>
            </p>
          )}
          {(mode === "reset" || mode === "recover") && (
            <p className="ref-links">
              <button
                type="button"
                className="ref-link"
                onClick={() => {
                  setMode("signin");
                  setNotice(null);
                  setPassword("");
                  setRecoveryCode("");
                  setRecoveryVerified(false);
                  setGoogleOnlyRecovery(false);
                  resetCaptcha();
                }}
              >
                Back to log in
              </button>
            </p>
          )}
          {mode === "signin" && (
            <p className="ref-terms-copy">By continuing you accept our policy and terms of use</p>
          )}
        </div>
      </section>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-4z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.7-.4-4z"
      />
    </svg>
  );
}

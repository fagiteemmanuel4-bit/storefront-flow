import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { errorMessage } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

/* Strap favicon: lime ring and dot on ink. Inlined so no extra file is needed. */
const FAVICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#0E1116"/><circle cx="16" cy="16" r="10.5" fill="none" stroke="#C6F432" stroke-width="2.5"/><circle cx="16" cy="16" r="4.5" fill="#C6F432"/></svg>';
const FAVICON = `data:image/svg+xml,${encodeURIComponent(FAVICON_SVG)}`;

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in or create your shop — Strap" },
      { name: "description", content: "Sign in to Strap or create an account for your shop." },
    ],
    links: [{ rel: "icon", type: "image/svg+xml", href: FAVICON }],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Enter a valid email address").max(255);
const passwordSchema = z.string().min(8, "Use at least 8 characters").max(72);
const nameSchema = z.string().trim().min(2, "Enter your full name").max(120);
const strapVoiceScript = "This is Strap. A simpler way to run your shop. Keep your sales moving, stay on top of inventory, and spend less time wrestling with admin. Strap puts the everyday rhythm of your business in one focused workspace. Welcome to Strap.";

function normalizeEmail(value: string) { return value.trim().toLowerCase(); }
function verificationUrl(email?: string) { return `${window.location.origin}/verify-email${email ? `?email=${encodeURIComponent(email)}` : ""}`; }
async function requestLoginOtp(email: string) {
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: verificationUrl(email) } });
  if (error) throw new Error(error.message);
}

function StrapLogo() {
  return (
    <Link to="/" className="strap-logo" aria-label="Strap home">
      <span className="strap-logo-mark" aria-hidden="true" />
      <span className="strap-logo-word">Strap</span>
    </Link>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "reset" | "recover">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Keep the browser tab icon in sync with the Strap logo.
  useEffect(() => {
    const links = document.querySelectorAll<HTMLLinkElement>("link[rel~='icon']");
    if (links.length) {
      links.forEach((link) => { link.type = "image/svg+xml"; link.href = FAVICON; });
    } else {
      const link = document.createElement("link");
      link.rel = "icon";
      link.type = "image/svg+xml";
      link.href = FAVICON;
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "recover" || window.location.hash.includes("type=recovery")) {
      setMode("recover");
      return;
    }
    let cancelled = false;
    void supabase.auth.getUser().then(({ data }) => {
      if (!cancelled && data.user) void navigate({ to: "/pos", replace: true });
    });
    return () => { cancelled = true; };
  }, [navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (mode !== "recover") {
      const parsedEmail = emailSchema.safeParse(normalizeEmail(email));
      if (!parsedEmail.success) { toast.error(parsedEmail.error.issues[0]!.message); return; }
      const normalizedEmail = parsedEmail.data;

      if (mode === "reset") {
        setBusy(true);
        setNotice(null);
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
            redirectTo: `${window.location.origin}/verified?kind=password&next=${encodeURIComponent("/auth?mode=recover")}`,
          });
          if (error) throw new Error(error.message);
          setNotice("If an account exists for this email, we sent a secure password-reset link. Open it to continue.");
        } catch (error) {
          toast.error(errorMessage(error, "We couldn't send that reset link."));
        } finally {
          setBusy(false);
        }
        return;
      }

      const parsedPassword = passwordSchema.safeParse(password);
      if (!parsedPassword.success) { toast.error(parsedPassword.error.issues[0]!.message); return; }

      let validatedName: string | undefined;
      if (mode === "signup") {
        const parsedName = nameSchema.safeParse(fullName);
        if (!parsedName.success) { toast.error(parsedName.error.issues[0]!.message); return; }
        validatedName = parsedName.data;
        if (!accepted) { toast.error("Please accept the Terms and Privacy Policy to continue."); return; }
      }

      setBusy(true);
      setNotice(null);
      try {
        if (mode === "signup") {
          const { data, error } = await supabase.auth.signUp({
            email: normalizedEmail,
            password: parsedPassword.data,
            options: { emailRedirectTo: verificationUrl(normalizedEmail), data: { full_name: validatedName } },
          });
          if (error) throw new Error(error.message);
          if (!data.user) throw new Error("Strap couldn't create the account. Please try again.");
          sessionStorage.setItem("strap_otp_email", normalizedEmail);
          sessionStorage.setItem("strap_otp_flow", "signup");
          await navigate({ to: "/verify-email", search: { email: normalizedEmail }, replace: true });
          return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password: parsedPassword.data });
        if (error) {
          if (error.message.toLowerCase().includes("email not confirmed")) {
            await requestLoginOtp(normalizedEmail);
            sessionStorage.setItem("strap_otp_email", normalizedEmail);
            sessionStorage.setItem("strap_otp_flow", "signin");
            void navigate({ to: "/verify-email", search: { email: normalizedEmail }, replace: true });
            return;
          }
          throw new Error(error.message);
        }
        if (!data.session || !data.user) throw new Error("Sign in did not complete. Please try again.");
        await supabase.auth.signOut();
        await requestLoginOtp(normalizedEmail);
        sessionStorage.setItem("strap_otp_email", normalizedEmail);
        sessionStorage.setItem("strap_otp_flow", "signin");
        void navigate({ to: "/verify-email", search: { email: normalizedEmail }, replace: true });
      } catch (error) {
        toast.error(errorMessage(error, "That didn't work. Please check your details and try again."));
      } finally {
        setBusy(false);
      }
      return;
    }

    const parsedPassword = passwordSchema.safeParse(password);
    if (!parsedPassword.success) { toast.error(parsedPassword.error.issues[0]!.message); return; }
    setBusy(true);
    setNotice(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: parsedPassword.data });
      if (error) throw new Error(error.message);
      await supabase.auth.signOut();
      setNotice("Your password has been updated. You can now sign in with the new password.");
      setPassword("");
      setMode("signin");
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't update your password."));
    } finally {
      setBusy(false);
    }
  }

  const title = mode === "signin" ? "Log in" : mode === "signup" ? "Create your account" : mode === "reset" ? "Reset password" : "Choose a new password";
  const subtitle = mode === "signin" ? "Welcome back. Enter your details to continue." : mode === "signup" ? "Set up your shop in a few minutes." : mode === "reset" ? "We’ll send a secure link to your email." : "Finish your password change securely.";
  const switchMode = mode === "signin" ? "signup" : "signin";
  const submitLabel = mode === "signin" ? "Log in" : mode === "signup" ? "Create account" : mode === "reset" ? "Send reset link" : "Update password";

  return (
    <main className="strap-auth-main">
      <div className="strap-auth-card">
        <aside className="strap-auth-aside">
          <svg className="strap-auth-rings" aria-hidden="true" viewBox="0 0 700 700" fill="none" stroke="#C6F432" strokeWidth="2">
            <circle cx="350" cy="350" r="60" />
            <circle cx="350" cy="350" r="120" strokeOpacity=".7" />
            <circle cx="350" cy="350" r="180" strokeOpacity=".5" />
            <circle cx="350" cy="350" r="240" strokeOpacity=".32" />
            <circle cx="350" cy="350" r="300" strokeOpacity=".18" />
            <circle cx="350" cy="110" r="9" fill="#C6F432" stroke="none" />
            <circle cx="562" cy="472" r="9" fill="#C6F432" stroke="none" />
            <circle cx="230" cy="530" r="9" fill="#C6F432" stroke="none" />
          </svg>
          <StrapLogo />
          <div className="strap-auth-hero">
            <h2>Run the shop. Don’t run after the paperwork.</h2>
            <p>Your business deserves a system you can trust.</p>
          </div>
          <small className="strap-auth-copy">© 2026 Strap by Kryonara</small>
        </aside>

        <section className="strap-auth-form-panel">
          <div className="strap-auth-box">
            <h1 className="strap-auth-title">{title}</h1>
            <p className="strap-auth-sub">{subtitle}</p>

            <form onSubmit={handleSubmit} className="strap-auth-form" noValidate={false}>
              {mode === "signup" && (
                <div className="strap-field-wrap">
                  <Label htmlFor="name" className="strap-label">Full name</Label>
                  <Input id="name" value={fullName} onChange={(event) => setFullName(event.target.value)} className="strap-field" autoComplete="name" maxLength={120} placeholder="Your full name" required />
                </div>
              )}

              {mode !== "recover" && (
                <div className="strap-field-wrap">
                  <Label htmlFor="email" className="strap-label">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="strap-field" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} placeholder="you@yourbusiness.com" required />
                </div>
              )}

              {mode !== "reset" && (
                <div className="strap-field-wrap">
                  <div className="strap-field-row">
                    <Label htmlFor="password" className="strap-label">{mode === "recover" ? "New password" : "Password"}</Label>
                    {mode === "signin" && (
                      <button type="button" className="strap-link" onClick={() => { setMode("reset"); setNotice(null); }}>Forgot password?</button>
                    )}
                  </div>
                  <div className="strap-pw">
                    <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} className="strap-field" autoComplete={mode === "signin" ? "current-password" : "new-password"} placeholder={mode === "signin" ? "Enter your password" : "Create a password"} required />
                    <button type="button" className="strap-eye" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>
                      {showPassword ? <EyeOff size={22} aria-hidden="true" /> : <Eye size={22} aria-hidden="true" />}
                    </button>
                  </div>
                </div>
              )}

              {mode === "signup" && (
                <label className="strap-terms">
                  <Checkbox checked={accepted} onCheckedChange={(value) => setAccepted(value === true)} className="strap-check" aria-label="Accept terms and privacy policy" />
                  <span>I agree to the <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.</span>
                </label>
              )}

              {notice && <div className="strap-notice" role="status">{notice}</div>}

              <Button type="submit" disabled={busy} className="strap-btn strap-btn-primary">
                {busy ? "Please wait…" : submitLabel}
              </Button>
            </form>

            {(mode === "signin" || mode === "signup") && (
              <>
                <div className="strap-or" aria-hidden="true">or</div>
                <div style={{ marginTop: 20 }}>
                  <Button type="button" disabled aria-disabled="true" className="strap-btn strap-btn-ghost">
                    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    Continue with Google
                    <span className="strap-soon">Coming soon</span>
                  </Button>
                </div>
                <p className="strap-auth-alt" style={{ marginTop: 20 }}>
                  {mode === "signin" ? "New to Strap?" : "Already have an account?"}{" "}
                  <button type="button" className="strap-link" onClick={() => { setMode(switchMode); setNotice(null); }}>
                    {mode === "signin" ? "Create an account" : "Log in"}
                  </button>
                </p>
              </>
            )}

            {(mode === "reset" || mode === "recover") && (
              <button type="button" className="strap-link strap-auth-back" onClick={() => { setMode("signin"); setNotice(null); setPassword(""); }}>
                Back to log in
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { errorMessage } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in or create your shop — Kudi" },
      { name: "description", content: "Sign in to your Kudi till, or create a free account for your shop." },
      { property: "og:title", content: "Sign in or create your shop — Kudi" },
      { property: "og:description", content: "Sign in to your Kudi till or open a free account." },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Enter a valid email address").max(255);
const passwordSchema = z.string().min(8, "Use at least 8 characters").max(72);
const nameSchema = z.string().trim().min(2, "Enter your full name").max(120);

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "reset" | "recover" | "otp" | "otpcode">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setMode("recover");
      return () => { cancelled = true; };
    }
    void supabase.auth.getUser().then(({ data }) => {
      if (!cancelled && data.user) void navigate({ to: "/pos", replace: true });
    });
    return () => { cancelled = true; };
  }, [navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsedEmail = emailSchema.safeParse(email);
    if (!parsedEmail.success) {
      toast.error(parsedEmail.error.issues[0]!.message);
      return;
    }

    if (mode === "reset") {
      setBusy(true); setNotice(null);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(parsedEmail.data, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw new Error(error.message);
        setNotice("Check your email for a reset link. Open it on this device to set a new password.");
      } catch (error) { toast.error(errorMessage(error, "We couldn't send that reset link.")); }
      finally { setBusy(false); }
      return;
    }

    if (mode === "otp") {
      setBusy(true); setNotice(null);
      try {
        const { error } = await supabase.auth.signInWithOtp({ email: parsedEmail.data, options: { shouldCreateUser: false } });
        if (error) throw new Error(error.message);
        setMode("otpcode");
        setNotice(`We sent a 6-digit code to ${parsedEmail.data}. Enter it below to finish signing in.`);
      } catch (error) { toast.error(errorMessage(error, "We couldn't send a code. Make sure you already have a Kudi account.")); }
      finally { setBusy(false); }
      return;
    }

    if (mode === "otpcode") {
      const code = otpToken.replace(/\D/g, "");
      if (code.length !== 6) { toast.error("Enter the 6-digit code from your email."); return; }
      setBusy(true);
      try {
        const { data, error } = await supabase.auth.verifyOtp({ email: parsedEmail.data, token: code, type: "email" });
        if (error) throw new Error(error.message);
        if (!data.session || !data.user) throw new Error("That code didn't complete sign in. Try again.");
        toast.success("Signed in successfully");
        void navigate({ to: "/pos", replace: true });
      } catch (error) { toast.error(errorMessage(error, "That code is wrong or expired.")); }
      finally { setBusy(false); }
      return;
    }

    const parsedPassword = passwordSchema.safeParse(password);
    if (!parsedPassword.success) { toast.error(parsedPassword.error.issues[0]!.message); return; }

    if (mode === "signup") {
      const parsedName = nameSchema.safeParse(fullName);
      if (!parsedName.success) { toast.error(parsedName.error.issues[0]!.message); return; }
      if (!accepted) { toast.error("Please accept the Terms and Privacy Policy to continue."); return; }
    }

    setBusy(true); setNotice(null);
    try {
      if (mode === "recover") {
        const { error } = await supabase.auth.updateUser({ password: parsedPassword.data });
        if (error) throw new Error(error.message);
        toast.success("Password updated");
        void navigate({ to: "/pos", replace: true });
        return;
      }

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: parsedEmail.data,
          password: parsedPassword.data,
          options: {
            emailRedirectTo: `${window.location.origin}/email-confirmed`,
            data: { full_name: parsedName.data },
          },
        });
        if (error) throw new Error(error.message);
        if (!data.session) {
          setNotice("Your account was created. Check your email and confirm your address before signing in.");
          return;
        }
        void navigate({ to: "/onboarding", replace: true });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: parsedEmail.data, password: parsedPassword.data });
        if (error) throw new Error(error.message);
        if (!data.session || !data.user) throw new Error("Sign in did not complete. Please try again.");
        void navigate({ to: "/pos", replace: true });
      }
    } catch (error) { toast.error(errorMessage(error, "That didn't work. Please try again.")); }
    finally { setBusy(false); }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-10 sm:px-6">
      <Link to="/" className="mx-auto flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-full bg-accent">
          <span className="size-3 rotate-45 rounded-[3px] bg-foreground" />
        </span>
        <span className="font-display text-xl font-bold tracking-tight">KUDI.</span>
      </Link>
      <div className="mx-auto mt-10 w-full max-w-md">
        <h1 className="text-display-md">{mode === "signin" ? "Open your till" : mode === "signup" ? "Create your shop account" : mode === "reset" ? "Reset your password" : mode === "otp" ? "Sign in with an email code" : mode === "otpcode" ? "Enter your verification code" : "Set a new password"}</h1>
        <p className="mt-2 text-muted-foreground">{mode === "signin" ? "Sign in to keep selling." : mode === "signup" ? "Create your account with your name and a password." : mode === "reset" ? "We'll email you a link to choose a new password." : mode === "otp" ? "Use this only if you already have a Kudi account." : mode === "otpcode" ? `Type the 6-digit code we sent to ${email}.` : "Choose a new password for your account."}</p>
        <form onSubmit={handleSubmit} className="surface-card mt-6 space-y-4 rounded-2xl border p-5 sm:p-6">
          {mode === "signup" && <div className="space-y-2"><Label htmlFor="name">Your name</Label><Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-12 rounded-xl" autoComplete="name" maxLength={120} required /></div>}
          {mode !== "recover" && <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl" autoComplete="email" disabled={mode === "otpcode"} required /></div>}
          {mode === "otpcode" && <div className="space-y-2"><Label htmlFor="code">6-digit code</Label><Input id="code" inputMode="numeric" autoComplete="one-time-code" value={otpToken} onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, "").slice(0, 6))} className="numeric h-14 rounded-xl text-center text-2xl tracking-[0.4em]" maxLength={6} placeholder="000000" required /></div>}
          {mode !== "reset" && mode !== "otp" && mode !== "otpcode" && <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="password">{mode === "recover" ? "New password" : "Password"}</Label>{mode === "signin" && <button type="button" className="text-sm font-semibold text-accent-ink underline" onClick={() => { setMode("reset"); setNotice(null); }}>Forgot password?</button>}</div><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl" autoComplete={mode === "signin" ? "current-password" : "new-password"} required /></div>}
          {mode === "signup" && <label className="flex items-start gap-3 text-sm text-muted-foreground"><Checkbox checked={accepted} onCheckedChange={(value) => setAccepted(value === true)} className="mt-0.5" aria-label="Accept terms and privacy policy" /><span>I have read and accept the <Link to="/terms" className="font-semibold text-accent-ink underline">Terms of Service</Link> and <Link to="/privacy" className="font-semibold text-accent-ink underline">Privacy Policy</Link>.</span></label>}
          {notice && <p className="rounded-xl bg-accent-soft p-3 text-sm text-accent-ink">{notice}</p>}
          <Button type="submit" className="h-12 w-full rounded-xl" disabled={busy}>{busy ? "Working…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : mode === "reset" ? "Send reset link" : mode === "otp" ? "Email me a code" : mode === "otpcode" ? "Verify code" : "Save new password"}</Button>
          {(mode === "signin" || mode === "signup") && <button type="button" className="w-full text-center text-sm font-semibold text-accent-ink underline" onClick={() => { setMode("otp"); setNotice(null); }}>Use an email code instead</button>}
          {mode === "otp" && <button type="button" className="w-full text-center text-sm font-semibold text-foreground underline" onClick={() => { setMode("signin"); setNotice(null); }}>Use a password instead</button>}
          {mode === "otpcode" && <button type="button" className="w-full text-center text-sm font-semibold text-foreground underline" onClick={() => { setOtpToken(""); setMode("otp"); setNotice(null); }}>Send a new code</button>}
        </form>
        {(mode === "signin" || mode === "signup") && <p className="mt-5 text-center text-sm text-muted-foreground">{mode === "signin" ? "New here?" : "Already have an account?"} <button type="button" className="font-semibold text-foreground underline" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setNotice(null); }}>{mode === "signin" ? "Create an account" : "Sign in instead"}</button></p>}
      </div>
    </div>
  );
}

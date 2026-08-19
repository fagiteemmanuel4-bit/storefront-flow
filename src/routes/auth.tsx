import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { errorMessage } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/auth")({ ssr: false, head: () => ({ meta: [{ title: "Sign in or create your shop — Kudi" }, { name: "description", content: "Sign in to Kudi or create an account for your shop." }] }), component: AuthPage });
const emailSchema = z.string().trim().email("Enter a valid email address").max(255);
const passwordSchema = z.string().min(8, "Use at least 8 characters").max(72);
const nameSchema = z.string().trim().min(2, "Enter your full name").max(120);
function normalizeEmail(value: string) { return value.trim().toLowerCase(); }

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "recover" || window.location.hash.includes("type=recovery")) { setMode("recover"); return; }
    let cancelled = false;
    void supabase.auth.getUser().then(({ data }) => { if (!cancelled && data.user) void navigate({ to: "/pos", replace: true }); });
    return () => { cancelled = true; };
  }, [navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (mode !== "recover") {
      const parsedEmail = emailSchema.safeParse(normalizeEmail(email));
      if (!parsedEmail.success) { toast.error(parsedEmail.error.issues[0]!.message); return; }
      const normalizedEmail = parsedEmail.data;
      if (mode === "reset") {
        setBusy(true); setNotice(null);
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo: `${window.location.origin}/verified?kind=password&next=${encodeURIComponent("/auth?mode=recover")}` });
          if (error) throw new Error(error.message);
          setNotice("If an account exists for this email, we sent a secure password-reset link. Open it to continue.");
        } catch (error) { toast.error(errorMessage(error, "We couldn't send that reset link.")); } finally { setBusy(false); }
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
      setBusy(true); setNotice(null);
      try {
        if (mode === "signup") {
          const { data, error } = await supabase.auth.signUp({ email: normalizedEmail, password: parsedPassword.data, options: { emailRedirectTo: `${window.location.origin}/verified?kind=email&next=${encodeURIComponent("/auth")}`, data: { full_name: validatedName } } });
          if (error) throw new Error(error.message);
          if (!data.user) throw new Error("Kudi couldn't create the account. Please try again.");
          await supabase.auth.signOut();
          setNotice("Account created. We sent a verification link to your email. Open that link before signing in.");
          return;
        }
        const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password: parsedPassword.data });
        if (error) { if (error.message.toLowerCase().includes("email not confirmed")) setNotice("Your email is not verified yet. Open the verification link we sent to you, then sign in again."); throw new Error(error.message); }
        if (!data.session || !data.user) throw new Error("Sign in did not complete. Please try again.");
        void navigate({ to: "/pos", replace: true });
      } catch (error) { toast.error(errorMessage(error, "That didn't work. Please check your details and try again.")); } finally { setBusy(false); }
      return;
    }

    const parsedPassword = passwordSchema.safeParse(password);
    if (!parsedPassword.success) { toast.error(parsedPassword.error.issues[0]!.message); return; }
    setBusy(true); setNotice(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: parsedPassword.data });
      if (error) throw new Error(error.message);
      await supabase.auth.signOut();
      setNotice("Your password has been updated. You can now sign in with the new password.");
      setPassword(""); setMode("signin");
    } catch (error) { toast.error(errorMessage(error, "We couldn't update your password.")); } finally { setBusy(false); }
  }

  const title = mode === "signin" ? "Open your till" : mode === "signup" ? "Create your shop account" : mode === "reset" ? "Reset your password" : "Choose a new password";
  const subtitle = mode === "signin" ? "Sign in to keep selling." : mode === "signup" ? "Create your account with your name and a password." : mode === "reset" ? "We'll send a secure verification link to your email." : "Use the secure link we sent you to finish changing your password.";

  return <div className="flex min-h-screen flex-col bg-background px-4 py-10 sm:px-6">
    <Link to="/" className="mx-auto flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-full bg-accent"><span className="size-3 rotate-45 rounded-[3px] bg-foreground" /></span><span className="font-display text-xl font-bold tracking-tight">KUDI.</span></Link>
    <div className="mx-auto mt-10 w-full max-w-md">
      <div className="mb-6 text-center"><div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-border bg-surface shadow-lift"><ShieldCheck className="size-5" /></div><h1 className="text-display-md mt-5">{title}</h1><p className="mt-2 text-muted-foreground">{subtitle}</p></div>
      <form onSubmit={handleSubmit} className="surface-card space-y-4 rounded-3xl border p-5 shadow-lift sm:p-6">
        {mode === "signup" && <div className="space-y-2"><Label htmlFor="name">Your name</Label><Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-12 rounded-xl" autoComplete="name" maxLength={120} required /></div>}
        {mode !== "recover" && <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl" autoComplete="email" required /></div>}
        {mode !== "reset" && <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="password">{mode === "recover" ? "New password" : "Password"}</Label>{mode === "signin" && <button type="button" className="text-sm font-semibold text-accent-ink underline underline-offset-4" onClick={() => { setMode("reset"); setNotice(null); }}>Forgot password?</button>}</div><div className="relative"><Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl pr-11" autoComplete={mode === "signin" ? "current-password" : "new-password"} required /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></div>}
        {mode === "signup" && <label className="flex items-start gap-3 rounded-xl bg-secondary/50 p-3 text-sm text-muted-foreground"><Checkbox checked={accepted} onCheckedChange={(value) => setAccepted(value === true)} className="mt-0.5" aria-label="Accept terms and privacy policy" /><span>I accept the <Link to="/terms" className="font-semibold text-accent-ink underline">Terms</Link> and <Link to="/privacy" className="font-semibold text-accent-ink underline">Privacy Policy</Link>.</span></label>}
        {notice && <div className="rounded-xl border border-border bg-secondary/60 p-3 text-sm text-muted-foreground">{notice}</div>}
        <Button type="submit" className="h-12 w-full rounded-xl" disabled={busy}>{busy ? "Working…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : mode === "reset" ? "Send verification link" : "Save new password"}</Button>
        {mode === "signin" && <p className="text-center text-xs text-muted-foreground">New accounts are verified by email before first sign in.</p>}
      </form>
      {(mode === "signin" || mode === "signup") && <p className="mt-5 text-center text-sm text-muted-foreground">{mode === "signin" ? "New here?" : "Already have an account?"} <button type="button" className="font-semibold text-foreground underline" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setNotice(null); }}>{mode === "signin" ? "Create an account" : "Sign in instead"}</button></p>}
      {(mode === "reset" || mode === "recover") && <button type="button" className="mt-5 block w-full text-center text-sm font-semibold text-foreground underline" onClick={() => { setMode("signin"); setNotice(null); }}>Back to sign in</button>}
    </div>
  </div>;
}

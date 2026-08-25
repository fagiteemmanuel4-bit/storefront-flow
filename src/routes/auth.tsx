import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
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
  head: () => ({ meta: [{ title: "Sign in or create your shop — Strap" }, { name: "description", content: "Sign in to Strap or create an account for your shop." }] }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Enter a valid email address").max(255);
const passwordSchema = z.string().min(8, "Use at least 8 characters").max(72);
const nameSchema = z.string().trim().min(2, "Enter your full name").max(120);
function normalizeEmail(value: string) { return value.trim().toLowerCase(); }
function verificationUrl(email?: string) { return `${window.location.origin}/verify-email${email ? `?email=${encodeURIComponent(email)}` : ""}`; }

async function requestLoginOtp(email: string) {
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: verificationUrl(email) } });
  if (error) throw new Error(error.message);
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
          const { data, error } = await supabase.auth.signUp({ email: normalizedEmail, password: parsedPassword.data, options: { emailRedirectTo: verificationUrl(normalizedEmail), data: { full_name: validatedName } } });
          if (error) throw new Error(error.message);
          if (!data.user) throw new Error("Strap couldn't create the account. Please try again.");
          await supabase.auth.signOut();
          await requestLoginOtp(normalizedEmail);
          sessionStorage.setItem("strap_otp_email", normalizedEmail);
          sessionStorage.setItem("strap_otp_flow", "signup");
          void navigate({ to: "/verify-email", search: { email: normalizedEmail }, replace: true });
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

  const title = mode === "signin" ? "Welcome back." : mode === "signup" ? "Build your shop." : mode === "reset" ? "Reset your password." : "Choose a new password.";
  const subtitle = mode === "signin" ? "Your store is waiting. Sign in to pick up where you left off." : mode === "signup" ? "Everything you need to run a beautiful, modern shop." : mode === "reset" ? "We'll send a secure verification link to your email." : "Use the secure link we sent you to finish changing your password.";
  const isPrimaryAuth = mode === "signin" || mode === "signup";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f7f5] text-[#171715]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(245,194,62,0.24),transparent_27%),radial-gradient(circle_at_85%_85%,rgba(20,20,18,0.07),transparent_28%)]" />
      <div className="pointer-events-none absolute -left-32 top-1/3 size-72 rounded-full bg-[#f5c23e]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 top-0 size-[32rem] rounded-full border border-black/[0.035]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1500px] flex-col px-5 py-5 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between">
          <Link to="/" className="group flex items-center gap-3" aria-label="Strap home">
            <span className="relative flex size-10 items-center justify-center rounded-[13px] bg-[#171715] shadow-[0_8px_24px_-10px_rgba(0,0,0,.5)] transition-transform duration-300 group-hover:-rotate-3">
              <span className="size-3.5 rotate-45 rounded-[3px] bg-[#f5c23e]" />
            </span>
            <span className="font-display text-[1.15rem] font-bold tracking-[-0.04em]">STRAP.</span>
          </Link>
          <div className="hidden items-center gap-2 rounded-full border border-black/[0.07] bg-white/65 px-3 py-2 text-xs font-medium text-black/55 shadow-sm backdrop-blur-md sm:flex">
            <span className="size-1.5 rounded-full bg-emerald-500" /> Secure workspace
          </div>
        </header>

        <div className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-[1.08fr_.92fr] lg:gap-20 lg:py-14">
          <section className="hidden max-w-xl lg:block">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-black/[0.07] bg-white/70 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-black/50 shadow-sm backdrop-blur">
              <Sparkles className="size-3.5 text-[#b07d00]" /> Commerce, elevated
            </div>
            <h2 className="font-display text-[clamp(3.7rem,6vw,6.4rem)] font-semibold leading-[.9] tracking-[-.065em]">
              Run your shop<br />with <span className="relative inline-block">clarity<span className="absolute -bottom-2 left-1 right-1 h-1.5 rounded-full bg-[#f5c23e]/75" /></span>.
            </h2>
            <p className="mt-8 max-w-lg text-lg leading-8 text-black/55">Strap gives independent businesses a calmer way to manage sales, inventory and growth — without the clutter.</p>
            <div className="mt-10 grid max-w-md grid-cols-2 gap-3">
              {["Simple daily operations", "Inventory that stays clear", "Security-first access", "Built for growing shops"].map((item) => (
                <div key={item} className="flex items-center gap-2.5 rounded-2xl border border-black/[0.06] bg-white/55 px-3.5 py-3 text-sm text-black/65 backdrop-blur">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#f5c23e]/20"><Check className="size-3 text-[#8b6100]" /></span>{item}
                </div>
              ))}
            </div>
          </section>

          <section className="mx-auto w-full max-w-[500px]">
            <div className="mb-6 text-center lg:text-left">
              <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-2xl border border-black/[0.07] bg-white shadow-[0_14px_40px_-22px_rgba(0,0,0,.35)] lg:mx-0">
                {mode === "recover" ? <LockKeyhole className="size-5" /> : <ShieldCheck className="size-5" />}
              </div>
              <h1 className="font-display text-[clamp(2.35rem,5vw,3.45rem)] font-semibold leading-[.98] tracking-[-.05em]">{title}</h1>
              <p className="mx-auto mt-3 max-w-md text-[15px] leading-6 text-black/50 lg:mx-0">{subtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="rounded-[30px] border border-black/[0.08] bg-white/90 p-5 shadow-[0_30px_90px_-45px_rgba(0,0,0,.34)] backdrop-blur-xl sm:p-7">
              {mode === "signup" && <div className="mb-5 space-y-2"><Label htmlFor="name" className="text-xs font-semibold text-black/65">Your name</Label><Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-13 rounded-2xl border-black/[0.09] bg-[#fafaf8] px-4 shadow-none transition-all focus:border-[#d9a900] focus:ring-4 focus:ring-[#f5c23e]/15" autoComplete="name" maxLength={120} required /></div>}
              {mode !== "recover" && <div className="mb-5 space-y-2"><Label htmlFor="email" className="text-xs font-semibold text-black/65">Email address</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-13 rounded-2xl border-black/[0.09] bg-[#fafaf8] px-4 shadow-none transition-all focus:border-[#d9a900] focus:ring-4 focus:ring-[#f5c23e]/15" autoComplete="email" placeholder="you@yourbusiness.com" required /></div>}
              {mode !== "reset" && <div className="mb-5 space-y-2"><div className="flex items-center justify-between"><Label htmlFor="password" className="text-xs font-semibold text-black/65">{mode === "recover" ? "New password" : "Password"}</Label>{mode === "signin" && <button type="button" className="text-xs font-semibold text-black/45 transition-colors hover:text-black" onClick={() => { setMode("reset"); setNotice(null); }}>Forgot password?</button>}</div><div className="relative"><Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="h-13 rounded-2xl border-black/[0.09] bg-[#fafaf8] px-4 pr-12 shadow-none transition-all focus:border-[#d9a900] focus:ring-4 focus:ring-[#f5c23e]/15" autoComplete={mode === "signin" ? "current-password" : "new-password"} placeholder="••••••••" required /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-2.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-xl text-black/35 transition-colors hover:bg-black/[0.05] hover:text-black" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></div>}
              {mode === "signup" && <label className="mb-5 flex items-start gap-3 rounded-2xl border border-black/[0.06] bg-[#fafaf8] p-3.5 text-xs leading-5 text-black/50"><Checkbox checked={accepted} onCheckedChange={(value) => setAccepted(value === true)} className="mt-0.5 rounded-md" aria-label="Accept terms and privacy policy" /><span>I accept the <Link to="/terms" className="font-semibold text-black underline underline-offset-2">Terms</Link> and <Link to="/privacy" className="font-semibold text-black underline underline-offset-2">Privacy Policy</Link>.</span></label>}
              {notice && <div className="mb-5 rounded-2xl border border-emerald-600/15 bg-emerald-50 p-3.5 text-sm leading-5 text-emerald-800">{notice}</div>}
              <Button type="submit" className="group h-13 w-full rounded-2xl bg-[#171715] text-sm font-semibold text-white shadow-[0_14px_28px_-14px_rgba(0,0,0,.7)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#262622] hover:shadow-[0_20px_35px_-15px_rgba(0,0,0,.65)]" disabled={busy}><span>{busy ? "Securing your session…" : mode === "signin" ? "Continue securely" : mode === "signup" ? "Create my shop" : mode === "reset" ? "Send verification link" : "Save new password"}</span>{!busy && isPrimaryAuth && <ArrowRight className="ml-1 size-4 transition-transform duration-300 group-hover:translate-x-1" />}</Button>
              {isPrimaryAuth && <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-medium text-black/40"><ShieldCheck className="size-3.5" /> Password + one-time email verification</div>}
            </form>

            {isPrimaryAuth && <p className="mt-6 text-center text-sm text-black/45">{mode === "signin" ? "New to Strap?" : "Already have an account?"}{" "}<button type="button" className="font-semibold text-black underline decoration-black/20 underline-offset-4 transition-colors hover:decoration-black" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setNotice(null); }}>{mode === "signin" ? "Create an account" : "Sign in instead"}</button></p>}
            {(mode === "reset" || mode === "recover") && <button type="button" className="mx-auto mt-6 block text-sm font-semibold text-black/55 underline decoration-black/15 underline-offset-4 hover:text-black" onClick={() => { setMode("signin"); setNotice(null); }}>Back to sign in</button>}
          </section>
        </div>

        <footer className="flex items-center justify-between border-t border-black/[0.06] pt-4 text-[11px] font-medium text-black/35"><span>© {new Date().getFullYear()} Strap</span><span className="hidden items-center gap-1.5 sm:flex"><LockKeyhole className="size-3" /> Your account is protected</span></footer>
      </div>
    </main>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck, Play, Pause } from "lucide-react";
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
      { title: "Sign in or create your shop — Strap" },
      { name: "description", content: "Sign in to Strap or create an account for your shop." },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Enter a valid email address").max(255);
const passwordSchema = z.string().min(8, "Use at least 8 characters").max(72);
const nameSchema = z.string().trim().min(2, "Enter your full name").max(120);

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function verificationUrl(email?: string) {
  return `${window.location.origin}/verify-email${email ? `?email=${encodeURIComponent(email)}` : ""}`;
}

async function requestLoginOtp(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: verificationUrl(email) },
  });
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
  const [playing, setPlaying] = useState(false);

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
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

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
            },
          });
          if (error) throw new Error(error.message);
          if (!data.user) throw new Error("Strap couldn't create the account. Please try again.");
          await supabase.auth.signOut();
          await requestLoginOtp(normalizedEmail);
          sessionStorage.setItem("strap_otp_email", normalizedEmail);
          sessionStorage.setItem("strap_otp_flow", "signup");
          void navigate({ to: "/verify-email", search: { email: normalizedEmail }, replace: true });
          return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: parsedPassword.data,
        });
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
      setNotice("Your password has been updated. You can now sign in with the new password.");
      setPassword("");
      setMode("signin");
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't update your password."));
    } finally {
      setBusy(false);
    }
  }

  const title =
    mode === "signin"
      ? "Welcome back."
      : mode === "signup"
        ? "Build your shop."
        : mode === "reset"
          ? "Reset your password."
          : "Choose a new password.";

  const subtitle =
    mode === "signin"
      ? "Sign in to keep your store moving."
      : mode === "signup"
        ? "A calmer way to run your business."
        : mode === "reset"
          ? "We'll send a secure link to your email."
          : "Finish your password change securely.";

  const switchMode = mode === "signin" ? "signup" : "signin";

  return (
    <main className="min-h-screen bg-[#f7f6f2] text-[#171715] selection:bg-[#f5c23e]/30">
      <div className="mx-auto flex min-h-screen w-full max-w-[1480px] flex-col px-5 py-5 sm:px-8 lg:px-10">
        <header className="flex h-12 items-center justify-between">
          <Link to="/" className="group flex items-center gap-3" aria-label="Strap home">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#171715] transition-transform duration-300 group-hover:-rotate-3">
              <span className="size-3 rotate-45 rounded-[2px] bg-[#f5c23e]" />
            </span>
            <span className="font-display text-lg font-bold tracking-[-0.05em]">STRAP.</span>
          </Link>
          <span className="hidden text-xs font-medium text-black/40 sm:block">Simple commerce, thoughtfully made.</span>
        </header>

        <div className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-[minmax(0,1.12fr)_minmax(420px,.68fr)] lg:gap-20 lg:py-12">
          <section className="relative hidden min-h-[650px] lg:block" aria-label="About Strap">
            <div className="relative h-[500px] overflow-hidden rounded-[36px] bg-[#171715] shadow-[0_35px_90px_-45px_rgba(0,0,0,.5)]">
              <img
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1400&q=88"
                alt="Beautifully arranged modern retail store"
                className="absolute inset-0 size-full object-cover transition-transform duration-700 hover:scale-[1.025]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-black/10" />
              <div className="absolute left-7 top-7 rounded-full border border-white/20 bg-black/20 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.18em] text-white/75 backdrop-blur-md">
                About Strap
              </div>
              <div className="absolute inset-x-0 bottom-0 p-8 xl:p-10">
                <p className="max-w-2xl font-display text-[clamp(2.7rem,4.4vw,5.1rem)] font-semibold leading-[.9] tracking-[-.065em] text-white">
                  Your store, in rhythm.
                </p>
                <p className="mt-5 max-w-lg text-sm leading-6 text-white/65">
                  Strap brings sales, inventory and everyday shop operations into one beautifully focused workspace.
                </p>
              </div>
            </div>

            <div className="absolute -bottom-1 left-7 w-[290px] overflow-hidden rounded-[26px] border border-white/60 bg-white shadow-[0_25px_60px_-30px_rgba(0,0,0,.5)] xl:left-10">
              <div className="relative h-[155px] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=700&q=88"
                  alt="Premium product display in a shop"
                  className="size-full object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                <div className="absolute bottom-3 left-4 text-[10px] font-semibold uppercase tracking-[.16em] text-white/80">Made for real shops</div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-black/35">The Strap rhythm</p>
                    <p className="mt-1 text-sm font-semibold tracking-[-.02em]">Sell. Track. Grow.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPlaying((value) => !value)}
                    className="flex size-9 items-center justify-center rounded-full bg-[#171715] text-white transition-transform hover:scale-105"
                    aria-label={playing ? "Pause visual rhythm" : "Play visual rhythm"}
                  >
                    {playing ? <Pause className="size-3.5" /> : <Play className="ml-0.5 size-3.5" />}
                  </button>
                </div>
                <div className="mt-4 flex h-5 items-center gap-1 overflow-hidden">
                  {[12, 20, 8, 17, 25, 11, 21, 15, 27, 9, 18, 13, 23, 10, 19, 14, 24, 8, 17, 12].map((height, index) => (
                    <span
                      key={index}
                      className={`w-1 rounded-full bg-[#f5c23e] transition-all duration-300 ${playing ? "animate-pulse" : ""}`}
                      style={{ height: `${height}px`, animationDelay: `${index * 45}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute right-5 top-5 hidden rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-xl backdrop-blur-md xl:block">
              <p className="text-[9px] font-bold uppercase tracking-[.18em] text-black/35">Built for momentum</p>
              <p className="mt-1 font-display text-xl font-semibold tracking-[-.04em]">Less admin. More selling.</p>
            </div>
          </section>

          <section className="mx-auto w-full max-w-[460px] lg:mx-0 lg:ml-auto">
            <div className="mb-8">
              <div className="mb-6 flex size-11 items-center justify-center rounded-2xl border border-black/[0.07] bg-white shadow-[0_12px_30px_-20px_rgba(0,0,0,.35)]">
                {mode === "recover" ? <LockKeyhole className="size-[18px]" /> : <ShieldCheck className="size-[18px]" />}
              </div>
              <h1 className="font-display text-[clamp(2.4rem,5vw,3.6rem)] font-semibold leading-[.96] tracking-[-.055em]">{title}</h1>
              <p className="mt-3 text-[15px] leading-6 text-black/45">{subtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="rounded-[28px] border border-black/[0.075] bg-white p-5 shadow-[0_25px_70px_-45px_rgba(0,0,0,.38)] sm:p-7">
              {mode === "signup" && (
                <div className="mb-5 space-y-2">
                  <Label htmlFor="name" className="text-xs font-semibold text-black/65">Full name</Label>
                  <Input id="name" value={fullName} onChange={(event) => setFullName(event.target.value)} className="h-12 rounded-xl border-black/[0.09] bg-[#fbfaf7] px-4 shadow-none focus:border-[#c79508] focus:ring-4 focus:ring-[#f5c23e]/15" autoComplete="name" maxLength={120} required />
                </div>
              )}

              {mode !== "recover" && (
                <div className="mb-5 space-y-2">
                  <Label htmlFor="email" className="text-xs font-semibold text-black/65">Email address</Label>
                  <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 rounded-xl border-black/[0.09] bg-[#fbfaf7] px-4 shadow-none focus:border-[#c79508] focus:ring-4 focus:ring-[#f5c23e]/15" autoComplete="email" placeholder="you@yourbusiness.com" required />
                </div>
              )}

              {mode !== "reset" && (
                <div className="mb-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-semibold text-black/65">{mode === "recover" ? "New password" : "Password"}</Label>
                    {mode === "signin" && (
                      <button type="button" className="text-xs font-semibold text-black/40 hover:text-black" onClick={() => { setMode("reset"); setNotice(null); }}>
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 rounded-xl border-black/[0.09] bg-[#fbfaf7] px-4 pr-12 shadow-none focus:border-[#c79508] focus:ring-4 focus:ring-[#f5c23e]/15" autoComplete={mode === "signin" ? "current-password" : "new-password"} placeholder="••••••••" required />
                    <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-black/30 hover:bg-black/[0.04] hover:text-black" aria-label={showPassword ? "Hide password" : "Show password"}>
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
              )}

              {mode === "signup" && (
                <label className="mb-5 flex items-start gap-3 text-xs leading-5 text-black/45">
                  <Checkbox checked={accepted} onCheckedChange={(value) => setAccepted(value === true)} className="mt-0.5 rounded-md" aria-label="Accept terms and privacy policy" />
                  <span>I agree to the <Link to="/terms" className="font-semibold text-black underline underline-offset-2">Terms</Link> and <Link to="/privacy" className="font-semibold text-black underline underline-offset-2">Privacy Policy</Link>.</span>
                </label>
              )}

              {notice && <div className="mb-5 rounded-xl border border-emerald-600/15 bg-emerald-50 px-3.5 py-3 text-sm leading-5 text-emerald-800">{notice}</div>}

              <Button type="submit" disabled={busy} className="group h-12 w-full rounded-xl bg-[#171715] text-sm font-semibold text-white shadow-none transition-all hover:-translate-y-0.5 hover:bg-[#2a2a27] disabled:translate-y-0">
                {busy ? "Please wait…" : mode === "signin" ? "Continue" : mode === "signup" ? "Create your shop" : mode === "reset" ? "Send reset link" : "Update password"}
                {!busy && <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-0.5" />}
              </Button>
            </form>

            {(mode === "signin" || mode === "signup") && (
              <p className="mt-6 text-center text-sm text-black/45">
                {mode === "signin" ? "New to Strap?" : "Already have an account?"}{" "}
                <button type="button" className="font-semibold text-black underline underline-offset-4" onClick={() => { setMode(switchMode); setNotice(null); }}>
                  {mode === "signin" ? "Create your shop" : "Sign in"}
                </button>
              </p>
            )}

            {(mode === "reset" || mode === "recover") && (
              <button type="button" className="mt-6 block w-full text-center text-sm font-semibold text-black/45 hover:text-black" onClick={() => { setMode("signin"); setNotice(null); setPassword(""); }}>
                Back to sign in
              </button>
            )}

            <p className="mt-8 text-center text-[11px] leading-5 text-black/30">Protected access for your Strap workspace.</p>
          </section>
        </div>
      </div>
    </main>
  );
}

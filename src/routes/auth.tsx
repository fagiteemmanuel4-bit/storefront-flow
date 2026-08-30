import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
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
      { title: "Sign in — Strap" },
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

function StrapMark() {
  return (
    <span className="flex size-9 items-center justify-center rounded-[10px] bg-blue-600 shadow-[0_6px_18px_rgba(37,99,235,.2)]">
      <span className="size-3.5 rotate-45 rounded-[2px] bg-white" />
    </span>
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
    setNotice(null);

    if (mode !== "recover") {
      const parsedEmail = emailSchema.safeParse(normalizeEmail(email));
      if (!parsedEmail.success) {
        toast.error(parsedEmail.error.issues[0]?.message ?? "Enter a valid email address.");
        return;
      }

      const normalizedEmail = parsedEmail.data;

      if (mode === "reset") {
        setBusy(true);
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
            redirectTo: `${window.location.origin}/verified?kind=password&next=${encodeURIComponent("/auth?mode=recover")}`,
          });
          if (error) throw new Error(error.message);
          setNotice("If an account exists for this email, we sent a secure password-reset link.");
        } catch (error) {
          toast.error(errorMessage(error, "We couldn't send that reset link."));
        } finally {
          setBusy(false);
        }
        return;
      }

      const parsedPassword = passwordSchema.safeParse(password);
      if (!parsedPassword.success) {
        toast.error(parsedPassword.error.issues[0]?.message ?? "Use at least 8 characters.");
        return;
      }

      if (mode === "signup") {
        const parsedName = nameSchema.safeParse(fullName);
        if (!parsedName.success) {
          toast.error(parsedName.error.issues[0]?.message ?? "Enter your full name.");
          return;
        }
        if (!accepted) {
          toast.error("Please accept the Terms and Privacy Policy to continue.");
          return;
        }
      }

      setBusy(true);
      try {
        if (mode === "signup") {
          const { data, error } = await supabase.auth.signUp({
            email: normalizedEmail,
            password: parsedPassword.data,
            options: {
              emailRedirectTo: verificationUrl(normalizedEmail),
              data: { full_name: parsedName.data },
            },
          });
          if (error) throw new Error(error.message);
          if (!data.user) throw new Error("Strap couldn't create the account. Please try again.");
          sessionStorage.setItem("strap_otp_email", normalizedEmail);
          sessionStorage.setItem("strap_otp_flow", "signup");
          await navigate({ to: "/verify-email", search: { email: normalizedEmail }, replace: true });
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
            await navigate({ to: "/verify-email", search: { email: normalizedEmail }, replace: true });
            return;
          }
          throw new Error(error.message);
        }

        if (!data.user || !data.session) throw new Error("Sign in did not complete. Please try again.");

        await supabase.auth.signOut();
        await requestLoginOtp(normalizedEmail);
        sessionStorage.setItem("strap_otp_email", normalizedEmail);
        sessionStorage.setItem("strap_otp_flow", "signin");
        await navigate({ to: "/verify-email", search: { email: normalizedEmail }, replace: true });
      } catch (error) {
        toast.error(errorMessage(error, "That didn't work. Please check your details and try again."));
      } finally {
        setBusy(false);
      }
      return;
    }

    const parsedPassword = passwordSchema.safeParse(password);
    if (!parsedPassword.success) {
      toast.error(parsedPassword.error.issues[0]?.message ?? "Use at least 8 characters.");
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: parsedPassword.data });
      if (error) throw new Error(error.message);
      await supabase.auth.signOut();
      setPassword("");
      setMode("signin");
      setNotice("Your password has been updated. You can now sign in with the new password.");
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
        ? "Set up a calmer workspace for the way you sell."
        : mode === "reset"
          ? "We'll send a secure link to your email."
          : "Finish your password change securely.";

  const isRecover = mode === "recover";

  return (
    <main className="min-h-[100dvh] bg-slate-50 text-slate-950">
      <div className="mx-auto grid min-h-[100dvh] w-full max-w-[1500px] lg:grid-cols-[minmax(0,1fr)_minmax(480px,560px)]">
        <section className="relative hidden overflow-hidden bg-blue-600 px-10 py-10 text-white lg:flex lg:flex-col xl:px-14">
          <header className="flex items-center gap-3">
            <StrapMark />
            <span className="font-display text-lg font-bold tracking-[-0.04em]">STRAP.</span>
          </header>

          <div className="relative mt-auto max-w-3xl pb-8 xl:pb-16">
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold">
              Commerce, without the clutter.
            </span>
            <h1 className="mt-6 max-w-3xl font-display text-[clamp(3.25rem,6vw,6.4rem)] font-semibold leading-[0.92] tracking-[-0.07em]">
              Run the shop.
              <br />
              Keep the focus.
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-blue-50/90 xl:text-lg">
              Strap brings selling, inventory, customers, orders and your online store into one focused workspace.
            </p>

            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/15 bg-white/10">
              {[
                ["Sell", "Fast, simple checkout"],
                ["Stock", "Know what is available"],
                ["Grow", "See what is working"],
              ].map(([label, description]) => (
                <div key={label} className="bg-blue-700/25 px-4 py-4 backdrop-blur-sm">
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="mt-1 text-xs leading-5 text-blue-100/75">{description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-32 right-16 size-96 rounded-full border border-white/10" />
        </section>

        <section className="flex min-h-[100dvh] items-center justify-center bg-white px-5 py-8 sm:px-8 lg:px-12 xl:px-16">
          <div className="w-full max-w-[440px]">
            <div className="flex items-center justify-between lg:hidden">
              <Link to="/" className="flex items-center gap-2.5" aria-label="Strap home">
                <StrapMark />
                <span className="font-display text-lg font-bold tracking-[-0.04em]">STRAP.</span>
              </Link>
              <span className="text-xs font-medium text-slate-400">Commerce workspace</span>
            </div>

            <div className="mt-10 lg:mt-0">
              <div className="flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-blue-600">
                {isRecover || mode === "reset" ? <LockKeyhole className="size-[18px]" /> : <ShieldCheck className="size-[18px]" />}
              </div>
              <h2 className="mt-7 font-display text-[clamp(2.3rem,7vw,3.6rem)] font-semibold leading-[0.94] tracking-[-0.06em]">
                {title}
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-6 text-slate-500">{subtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8">
              {mode === "signup" && (
                <div className="mb-5 space-y-2">
                  <Label htmlFor="full-name" className="text-sm font-semibold text-slate-800">Full name</Label>
                  <Input
                    id="full-name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="h-12 rounded-xl border-slate-200 bg-white px-4 text-base shadow-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                    autoComplete="name"
                    maxLength={120}
                    placeholder="Your full name"
                    required
                  />
                </div>
              )}

              {mode !== "recover" && (
                <div className="mb-5 space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-slate-800">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-12 rounded-xl border-slate-200 bg-white px-4 text-base shadow-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                    autoComplete="email"
                    inputMode="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="you@yourbusiness.com"
                    required
                  />
                </div>
              )}

              {mode !== "reset" && (
                <div className="mb-5 space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <Label htmlFor="password" className="text-sm font-semibold text-slate-800">
                      {isRecover ? "New password" : "Password"}
                    </Label>
                    {mode === "signin" && (
                      <button
                        type="button"
                        className="rounded-lg px-1.5 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                        onClick={() => { setMode("reset"); setNotice(null); }}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="h-12 rounded-xl border-slate-200 bg-white px-4 pr-12 text-base shadow-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                      autoComplete={mode === "signin" ? "current-password" : "new-password"}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-1 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
              )}

              {mode === "signup" && (
                <label className="mb-5 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                  <Checkbox checked={accepted} onCheckedChange={(value) => setAccepted(Boolean(value))} className="mt-0.5" />
                  <span className="text-xs leading-5 text-slate-500">
                    I agree to Strap's <a href="/terms" className="font-semibold text-slate-800 underline underline-offset-2">Terms</a> and <a href="/privacy" className="font-semibold text-slate-800 underline underline-offset-2">Privacy Policy</a>.
                  </span>
                </label>
              )}

              {notice && (
                <div role="status" className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-5 text-blue-900">
                  {notice}
                </div>
              )}

              <Button
                type="submit"
                disabled={busy}
                className="h-12 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-none transition hover:bg-blue-700 focus-visible:ring-4 focus-visible:ring-blue-600/20 disabled:bg-blue-300"
              >
                {busy ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : mode === "reset" ? "Send reset link" : "Update password"}
                {!busy && <ArrowRight className="size-4" />}
              </Button>
            </form>

            <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate-100 pt-6">
              {mode === "signin" || mode === "signup" ? (
                <p className="text-sm text-slate-500">
                  {mode === "signin" ? "New to Strap?" : "Already have an account?"}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => { setMode("signin"); setNotice(null); setPassword(""); }}
                  className="text-sm font-semibold text-slate-700 hover:text-slate-950"
                >
                  Back to sign in
                </button>
              )}

              {(mode === "signin" || mode === "signup") && (
                <button
                  type="button"
                  onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setNotice(null); }}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                >
                  {mode === "signin" ? "Create an account" : "Sign in"}
                  <ArrowRight className="size-3.5" />
                </button>
              )}
            </div>

            <p className="mt-8 text-center text-xs leading-5 text-slate-400">
              Secure account access powered by Strap's commerce workspace.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

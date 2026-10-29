import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { errorMessage } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/auth")({ ssr: false, head: () => ({ meta: [{ title: "Sign in or create your shop — Strap" }, { name: "description", content: "Sign in to Strap or create an account for your shop." }] }), component: AuthPage });
const emailSchema = z.string().trim().email("Enter a valid email address").max(255);
const passwordSchema = z.string().min(8, "Use at least 8 characters").max(72);
const nameSchema = z.string().trim().min(2, "Enter your full name").max(120);
const strapVoiceScript = "This is Strap. A simpler way to run your shop. Keep your sales moving, stay on top of inventory, and spend less time wrestling with admin. Strap puts the everyday rhythm of your business in one focused workspace. Welcome to Strap.";
function normalizeEmail(value: string) { return value.trim().toLowerCase(); }
function verificationUrl(email?: string) { return `${window.location.origin}/verify-email${email ? `?email=${encodeURIComponent(email)}` : ""}`; }
async function requestLoginOtp(email: string) { const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: verificationUrl(email) } }); if (error) throw new Error(error.message); }

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "reset" | "recover">("signin");
  const [fullName, setFullName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [accepted, setAccepted] = useState(false); const [showPassword, setShowPassword] = useState(false); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => { const params = new URLSearchParams(window.location.search); if (params.get("mode") === "recover" || window.location.hash.includes("type=recovery")) { setMode("recover"); return; } let cancelled = false; void supabase.auth.getUser().then(({ data }) => { if (!cancelled && data.user) void navigate({ to: "/pos", replace: true }); }); return () => { cancelled = true; }; }, [navigate]);
  async function handleSubmit(event: React.FormEvent) { event.preventDefault(); if (mode !== "recover") { const parsedEmail = emailSchema.safeParse(normalizeEmail(email)); if (!parsedEmail.success) { toast.error(parsedEmail.error.issues[0]!.message); return; } const normalizedEmail = parsedEmail.data; if (mode === "reset") { setBusy(true); setNotice(null); try { const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo: `${window.location.origin}/verified?kind=password&next=${encodeURIComponent("/auth?mode=recover")}` }); if (error) throw new Error(error.message); setNotice("If an account exists for this email, we sent a secure password-reset link. Open it to continue."); } catch (error) { toast.error(errorMessage(error, "We couldn't send that reset link.")); } finally { setBusy(false); } return; } const parsedPassword = passwordSchema.safeParse(password); if (!parsedPassword.success) { toast.error(parsedPassword.error.issues[0]!.message); return; } let validatedName: string | undefined; if (mode === "signup") { const parsedName = nameSchema.safeParse(fullName); if (!parsedName.success) { toast.error(parsedName.error.issues[0]!.message); return; } validatedName = parsedName.data; if (!accepted) { toast.error("Please accept the Terms and Privacy Policy to continue."); return; } } setBusy(true); setNotice(null); try { if (mode === "signup") { const { data, error } = await supabase.auth.signUp({ email: normalizedEmail, password: parsedPassword.data, options: { emailRedirectTo: verificationUrl(normalizedEmail), data: { full_name: validatedName } } }); if (error) throw new Error(error.message); if (!data.user) throw new Error("Strap couldn't create the account. Please try again."); sessionStorage.setItem("strap_otp_email", normalizedEmail); sessionStorage.setItem("strap_otp_flow", "signup"); await navigate({ to: "/verify-email", search: { email: normalizedEmail }, replace: true }); return; } const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password: parsedPassword.data }); if (error) { if (error.message.toLowerCase().includes("email not confirmed")) { await requestLoginOtp(normalizedEmail); sessionStorage.setItem("strap_otp_email", normalizedEmail); sessionStorage.setItem("strap_otp_flow", "signin"); void navigate({ to: "/verify-email", search: { email: normalizedEmail }, replace: true }); return; } throw new Error(error.message); } if (!data.session || !data.user) throw new Error("Sign in did not complete. Please try again."); await supabase.auth.signOut(); await requestLoginOtp(normalizedEmail); sessionStorage.setItem("strap_otp_email", normalizedEmail); sessionStorage.setItem("strap_otp_flow", "signin"); void navigate({ to: "/verify-email", search: { email: normalizedEmail }, replace: true }); } catch (error) { toast.error(errorMessage(error, "That didn't work. Please check your details and try again.")); } finally { setBusy(false); } return; } const parsedPassword = passwordSchema.safeParse(password); if (!parsedPassword.success) { toast.error(parsedPassword.error.issues[0]!.message); return; } setBusy(true); setNotice(null); try { const { error } = await supabase.auth.updateUser({ password: parsedPassword.data }); if (error) throw new Error(error.message); await supabase.auth.signOut(); setNotice("Your password has been updated. You can now sign in with the new password."); setPassword(""); setMode("signin"); } catch (error) { toast.error(errorMessage(error, "We couldn't update your password.")); } finally { setBusy(false); } }
  const title = mode === "signin" ? "Welcome back." : mode === "signup" ? "Build your shop." : mode === "reset" ? "Reset your password." : "Choose a new password."; const subtitle = mode === "signin" ? "Sign in to keep your store moving." : mode === "signup" ? "A calmer way to run your business." : mode === "reset" ? "We'll send a secure link to your email." : "Finish your password change securely."; const switchMode = mode === "signin" ? "signup" : "signin";
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#f7f6f2] px-4 py-6 text-[#171715] selection:bg-[#f5c23e]/30 sm:px-6">
      <div className="w-full max-w-[430px]">
        <header className="mb-8 flex items-center justify-center">
          <Link to="/" className="group flex items-center gap-2.5" aria-label="Strap home">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#171715]">
              <span className="size-3 rotate-45 rounded-[2px] bg-[#f5c23e]" />
            </span>
            <span className="font-display text-xl font-bold tracking-[-.05em]">STRAP.</span>
          </Link>
        </header>

        <section className="rounded-[24px] border border-black/[.07] bg-white p-5 shadow-[0_24px_70px_-42px_rgba(0,0,0,.28)] sm:rounded-[28px] sm:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-2xl bg-[#f7f6f2] text-[#171715]">
              <LockKeyhole className="size-[18px]" />
            </div>
            <h1 className="font-display text-[clamp(2rem,8vw,2.75rem)] font-semibold leading-[1] tracking-[-.06em]">{title}</h1>
            <p className="mt-3 text-sm leading-6 text-black/50">{subtitle}</p>
          </div>

          {(mode === "signin" || mode === "signup") && (
            <>
              <button type="button" disabled aria-disabled="true" className="relative flex h-12 w-full cursor-not-allowed items-center justify-center gap-3 rounded-xl border border-black/10 bg-white px-3 text-sm font-semibold text-black/55 opacity-90">
                <svg aria-hidden="true" viewBox="0 0 48 48" className="size-[19px] shrink-0">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" transform="translate(0 4)" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 38.03 46.98 31.93 46.98 24.55Z" />
                  <path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.9 23.9 0 0 0 0 21.56l7.98-6.19Z" transform="translate(0 4)" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.44-4.88 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" transform="translate(0 -1)" />
                </svg>
                <span>Continue with Google</span>
                <span className="absolute -right-1 -top-2 rounded-full border border-[#ead9a0] bg-[#fff8dc] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[.08em] text-[#7c5a00]">Coming soon</span>
              </button>
              <div className="my-5 flex items-center gap-3" aria-hidden="true">
                <span className="h-px flex-1 bg-black/[.08]" />
                <span className="text-[10px] font-semibold uppercase tracking-[.16em] text-black/35">or use email</span>
                <span className="h-px flex-1 bg-black/[.08]" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-semibold text-black/65">Full name</Label>
                <Input id="name" value={fullName} onChange={(event) => setFullName(event.target.value)} className="h-12 rounded-xl border-black/[.09] bg-[#fbfaf7] px-4 shadow-none focus:border-[#c79508] focus:ring-4 focus:ring-[#f5c23e]/15" autoComplete="name" maxLength={120} required />
              </div>
            )}
            {mode !== "recover" && (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold text-black/65">Email address</Label>
                <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 rounded-xl border-black/[.09] bg-[#fbfaf7] px-4 text-[16px] shadow-none focus:border-[#c79508] focus:ring-4 focus:ring-[#f5c23e]/15" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} placeholder="you@yourbusiness.com" required />
              </div>
            )}
            {mode !== "reset" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="password" className="text-xs font-semibold text-black/65">{mode === "recover" ? "New password" : "Password"}</Label>
                  {mode === "signin" && <button type="button" className="min-h-9 shrink-0 px-1 text-xs font-semibold text-black/45 hover:text-black" onClick={() => { setMode("reset"); setNotice(null); }}>Forgot password?</button>}
                </div>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 rounded-xl border-black/[.09] bg-[#fbfaf7] px-4 pr-12 text-[16px] shadow-none focus:border-[#c79508] focus:ring-4 focus:ring-[#f5c23e]/15" autoComplete={mode === "signin" ? "current-password" : "new-password"} placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-1 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-lg text-black/35 hover:bg-black/[.04] hover:text-black" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
                </div>
              </div>
            )}
            {mode === "signup" && (
              <label className="flex items-start gap-3 text-xs leading-5 text-black/50">
                <Checkbox checked={accepted} onCheckedChange={(value) => setAccepted(value === true)} className="mt-0.5 size-5 rounded-md" aria-label="Accept terms and privacy policy" />
                <span>I agree to the <Link to="/terms" className="font-semibold text-black underline underline-offset-2">Terms</Link> and <Link to="/privacy" className="font-semibold text-black underline underline-offset-2">Privacy Policy</Link>.</span>
              </label>
            )}
            {notice && <div className="rounded-xl border border-emerald-600/15 bg-emerald-50 px-3.5 py-3 text-sm leading-5 text-emerald-800">{notice}</div>}
            <Button type="submit" disabled={busy} className="group h-12 w-full rounded-xl bg-[#171715] text-sm font-semibold text-white shadow-none transition-colors hover:bg-[#2a2a27]">
              {busy ? "Please wait…" : mode === "signin" ? "Continue" : mode === "signup" ? "Create your shop" : mode === "reset" ? "Send reset link" : "Update password"}
              {!busy && <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-0.5" />}
            </Button>
          </form>

          {(mode === "signin" || mode === "signup") && (
            <p className="mt-5 text-center text-sm text-black/50">
              {mode === "signin" ? "New to Strap?" : "Already have an account?"}{" "}
              <button type="button" className="min-h-9 px-1 font-semibold text-black underline underline-offset-4" onClick={() => { setMode(switchMode); setNotice(null); }}>
                {mode === "signin" ? "Create your shop" : "Sign in"}
              </button>
            </p>
          )}
          {(mode === "reset" || mode === "recover") && <button type="button" className="mt-5 flex min-h-10 w-full items-center justify-center text-sm font-semibold text-black/50 hover:text-black" onClick={() => { setMode("signin"); setNotice(null); setPassword(""); }}>Back to sign in</button>}
        </section>

        <p className="mt-5 text-center text-xs leading-5 text-black/35">Secure access for your Strap workspace.</p>
        <p className="mt-1 text-center text-[11px] text-black/30">Simple commerce, thoughtfully made.</p>
      </div>
    </main>
  );
}

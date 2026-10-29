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
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#f4f2eb] px-4 py-6 text-[#20211d] transition-colors duration-200 dark:bg-[#11120f] dark:text-[#f4f1e8] sm:px-6 sm:py-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#d7a927] via-[#f2d77a] to-[#d7a927]" />
      <div className="pointer-events-none absolute -left-28 -top-28 size-72 rounded-full bg-[#e9d99e]/25 blur-3xl dark:bg-[#b98c22]/[.08]" />
      <div className="pointer-events-none absolute -bottom-36 -right-28 size-96 rounded-full bg-[#d8d5c9]/40 blur-3xl dark:bg-[#a5a18f]/[.05]" />

      <div className="relative grid w-full max-w-[960px] overflow-hidden rounded-[28px] border border-[#dcd9cf] bg-[#fffefa] shadow-[0_28px_90px_-42px_rgba(38,34,21,.28)] dark:border-white/[.09] dark:bg-[#191a16] dark:shadow-[0_28px_90px_-42px_rgba(0,0,0,.8)] md:grid-cols-[.88fr_1.12fr]">
        <aside className="relative hidden min-h-[570px] flex-col justify-between overflow-hidden bg-[#252720] p-9 text-[#f8f5eb] dark:bg-[#25261f] md:flex lg:p-11">
          <div aria-hidden="true" className="absolute -right-24 top-24 size-64 rounded-full border border-[#d9b44c]/20" />
          <div aria-hidden="true" className="absolute -right-12 top-36 size-40 rounded-full border border-[#d9b44c]/20" />
          <div aria-hidden="true" className="absolute -bottom-28 -left-20 size-72 rounded-full bg-[#d9b44c]/[.07] blur-2xl" />
          <div className="relative">
            <Link to="/" className="inline-flex items-center gap-3" aria-label="Strap home">
              <span className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[.06]">
                <span className="size-3.5 rotate-45 rounded-[3px] bg-[#e6bf4e]" />
              </span>
              <span className="font-display text-xl font-bold tracking-[-.055em]">STRAP<span className="text-[#e6bf4e]">.</span></span>
            </Link>
            <div className="mt-20 max-w-[300px]">
              <p className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.22em] text-[#e6bf4e]"><span className="size-1.5 rounded-full bg-[#e6bf4e]" /> Shop management, made clear</p>
              <h2 className="font-display text-[42px] font-semibold leading-[1.02] tracking-[-.065em] lg:text-[48px]">More focus.<br />Less friction.</h2>
              <p className="mt-5 max-w-[265px] text-sm leading-6 text-white/60">The everyday tools to keep sales moving, stock in order, and your business on track.</p>
            </div>
          </div>
          <div className="relative border-t border-white/10 pt-5">
            <p className="text-xs leading-5 text-white/45">One calmer place for the work that keeps your shop going.</p>
            <p className="mt-2 text-[10px] font-medium uppercase tracking-[.17em] text-white/30">Simple commerce, thoughtfully made</p>
          </div>
        </aside>

        <section className="min-w-0 px-5 py-7 sm:px-9 sm:py-9 lg:px-11 lg:py-10">
          <header className="mb-7 flex items-center justify-between md:hidden">
            <Link to="/" className="inline-flex items-center gap-2.5" aria-label="Strap home">
              <span className="flex size-9 items-center justify-center rounded-xl bg-[#252720] dark:bg-[#e6bf4e]">
                <span className="size-3 rotate-45 rounded-[2px] bg-[#e6bf4e] dark:bg-[#252720]" />
              </span>
              <span className="font-display text-lg font-bold tracking-[-.055em]">STRAP<span className="text-[#b88a16] dark:text-[#e6bf4e]">.</span></span>
            </Link>
            <span className="text-[10px] font-semibold uppercase tracking-[.13em] text-[#77766e] dark:text-[#a5a397]">Your workspace</span>
          </header>

          <div className="mb-6">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[.2em] text-[#9a7417] dark:text-[#e6bf4e]">{mode === "signup" ? "Get started" : mode === "reset" || mode === "recover" ? "Account recovery" : "Welcome to Strap"}</p>
            <h1 className="font-display text-[34px] font-semibold leading-[1.04] tracking-[-.06em] sm:text-[38px]">{title}</h1>
            <p className="mt-2.5 text-sm leading-6 text-[#73736a] dark:text-[#aaa99e]">{subtitle}</p>
          </div>

          {(mode === "signin" || mode === "signup") && (
            <>
              <button type="button" disabled aria-disabled="true" className="relative flex h-[46px] w-full cursor-not-allowed items-center justify-center gap-3 rounded-xl border border-[#dedbd2] bg-white px-3 text-sm font-semibold text-[#55564f] opacity-90 dark:border-white/[.13] dark:bg-[#22231e] dark:text-[#e5e3db]">
                <svg aria-hidden="true" viewBox="0 0 48 48" className="size-[18px] shrink-0">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" transform="translate(0 4)" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 38.03 46.98 31.93 46.98 24.55Z" />
                  <path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.9 23.9 0 0 0 0 21.56l7.98-6.19Z" transform="translate(0 4)" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.44-4.88 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" transform="translate(0 -1)" />
                </svg>
                <span>Continue with Google</span>
                <span className="absolute -right-1 -top-2 rounded-full border border-[#ead9a0] bg-[#fff7d8] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[.07em] text-[#775600] dark:border-[#776126] dark:bg-[#3a321d] dark:text-[#f0d57c]">Coming soon</span>
              </button>
              <div className="my-5 flex items-center gap-3" aria-hidden="true">
                <span className="h-px flex-1 bg-[#e5e2d9] dark:bg-white/[.1]" />
                <span className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#99978d] dark:text-[#8e8d82]">or continue with email</span>
                <span className="h-px flex-1 bg-[#e5e2d9] dark:bg-white/[.1]" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-semibold text-[#494a43] dark:text-[#d5d3c9]">Full name</Label>
                <Input id="name" value={fullName} onChange={(event) => setFullName(event.target.value)} className="h-11 rounded-xl border-[#dedbd2] bg-[#f9f8f3] px-3.5 text-[16px] shadow-none placeholder:text-[#a6a397] focus-visible:ring-2 focus-visible:ring-[#d5ad39]/35 dark:border-white/[.12] dark:bg-[#22231e] dark:text-[#f4f1e8] dark:placeholder:text-[#77766e]" autoComplete="name" maxLength={120} required />
              </div>
            )}
            {mode !== "recover" && (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold text-[#494a43] dark:text-[#d5d3c9]">Email address</Label>
                <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 rounded-xl border-[#dedbd2] bg-[#f9f8f3] px-3.5 text-[16px] shadow-none placeholder:text-[#a6a397] focus-visible:ring-2 focus-visible:ring-[#d5ad39]/35 dark:border-white/[.12] dark:bg-[#22231e] dark:text-[#f4f1e8] dark:placeholder:text-[#77766e]" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} placeholder="you@yourbusiness.com" required />
              </div>
            )}
            {mode !== "reset" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="password" className="text-xs font-semibold text-[#494a43] dark:text-[#d5d3c9]">{mode === "recover" ? "New password" : "Password"}</Label>
                  {mode === "signin" && <button type="button" className="min-h-8 shrink-0 px-1 text-xs font-semibold text-[#8b6b1b] hover:text-[#5e470e] dark:text-[#e6bf4e] dark:hover:text-[#f2d77a]" onClick={() => { setMode("reset"); setNotice(null); }}>Forgot password?</button>}
                </div>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 rounded-xl border-[#dedbd2] bg-[#f9f8f3] px-3.5 pr-11 text-[16px] shadow-none placeholder:text-[#a6a397] focus-visible:ring-2 focus-visible:ring-[#d5ad39]/35 dark:border-white/[.12] dark:bg-[#22231e] dark:text-[#f4f1e8] dark:placeholder:text-[#77766e]" autoComplete={mode === "signin" ? "current-password" : "new-password"} placeholder="Enter your password" required />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#85847a] hover:bg-black/[.04] hover:text-[#20211d] dark:text-[#a5a397] dark:hover:bg-white/[.06] dark:hover:text-white" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
                </div>
              </div>
            )}
            {mode === "signup" && (
              <label className="flex items-start gap-3 text-xs leading-5 text-[#77766e] dark:text-[#aaa99e]">
                <Checkbox checked={accepted} onCheckedChange={(value) => setAccepted(value === true)} className="mt-0.5 size-4 rounded-md border-[#c9c6bb] data-[state=checked]:bg-[#292a23] dark:border-white/25 dark:data-[state=checked]:bg-[#d8b343]" aria-label="Accept terms and privacy policy" />
                <span>I agree to the <Link to="/terms" className="font-semibold text-[#45463e] underline underline-offset-2 dark:text-[#eee9d9]">Terms</Link> and <Link to="/privacy" className="font-semibold text-[#45463e] underline underline-offset-2 dark:text-[#eee9d9]">Privacy Policy</Link>.</span>
              </label>
            )}
            {notice && <div className="rounded-xl border border-[#d7c58d] bg-[#fff8dc] px-3.5 py-3 text-sm leading-5 text-[#6b5519] dark:border-[#6d5a28] dark:bg-[#302a1a] dark:text-[#f0d57c]">{notice}</div>}
            <Button type="submit" disabled={busy} className="group h-11 w-full rounded-xl bg-[#292a23] text-sm font-semibold text-white shadow-none transition-colors hover:bg-[#3b3c33] dark:bg-[#e4bd4b] dark:text-[#201f19] dark:hover:bg-[#f0ce67]">
              {busy ? "Please wait…" : mode === "signin" ? "Continue with email" : mode === "signup" ? "Create your shop" : mode === "reset" ? "Send reset link" : "Update password"}
              {!busy && <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-0.5" />}
            </Button>
          </form>

          {(mode === "signin" || mode === "signup") && (
            <p className="mt-5 text-center text-sm text-[#77766e] dark:text-[#aaa99e]">
              {mode === "signin" ? "New to Strap?" : "Already have an account?"}{" "}
              <button type="button" className="min-h-8 px-1 font-semibold text-[#292a23] underline underline-offset-4 dark:text-[#f0d57c]" onClick={() => { setMode(switchMode); setNotice(null); }}>
                {mode === "signin" ? "Create your shop" : "Sign in"}
              </button>
            </p>
          )}
          {(mode === "reset" || mode === "recover") && <button type="button" className="mt-5 flex min-h-9 w-full items-center justify-center text-sm font-semibold text-[#77766e] hover:text-[#20211d] dark:text-[#aaa99e] dark:hover:text-white" onClick={() => { setMode("signin"); setNotice(null); setPassword(""); }}>Back to sign in</button>}
          <p className="mt-6 border-t border-[#e9e6de] pt-4 text-center text-[11px] leading-5 text-[#9a988e] dark:border-white/[.09] dark:text-[#88877c]">Secure access for your Strap workspace.</p>
        </section>
        <p className="mt-4 text-center text-[10px] font-medium uppercase tracking-[.15em] text-[#929085] dark:text-[#77766e] md:col-span-2">Simple commerce, thoughtfully made</p>
      </div>
    </main>
  );}

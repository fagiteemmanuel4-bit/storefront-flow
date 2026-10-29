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
    <main className="min-h-[100dvh] bg-[#faf8f5] px-3 py-4 text-[#201d19] transition-colors dark:bg-[#10100f] dark:text-[#f6f2eb] sm:px-6 sm:py-6 lg:flex lg:items-center lg:justify-center">
      <div className="mx-auto w-full max-w-[1000px]">
        <div className="mb-5 flex items-center justify-between px-1 lg:hidden">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Strap home">
            <span className="flex size-8 items-center justify-center rounded-[10px] bg-[#201d19] dark:bg-[#f6f2eb]">
              <span className="size-3 rotate-45 rounded-[2px] bg-[#f28a32] dark:bg-[#d96b1b]" />
            </span>
            <span className="font-display text-lg font-bold tracking-[-.06em] dark:text-[#f6f2eb]">STRAP<span className="text-[#e87928]">.</span></span>
          </Link>
          <span className="text-[11px] font-medium text-[#8b8379] dark:text-[#aaa198]">Shop management, made simpler</span>
        </div>

        <div className="grid overflow-hidden rounded-[26px] border border-[#e8e1d8] bg-white shadow-[0_24px_80px_-48px_rgba(48,35,21,.3)] dark:border-[#34302b] dark:bg-[#191817] sm:rounded-[30px] lg:min-h-[650px] lg:grid-cols-[.9fr_1.1fr]">
          <aside className="relative hidden overflow-hidden bg-[#211f1b] p-9 text-[#f8f4ed] dark:bg-[#24211e] lg:flex lg:flex-col lg:justify-between xl:p-11">
            <div className="pointer-events-none absolute -right-24 -top-20 size-[340px] rounded-full border border-white/[.07]" />
            <div className="pointer-events-none absolute -right-12 -top-8 size-[245px] rounded-full border border-white/[.08]" />
            <div className="pointer-events-none absolute -bottom-28 -left-24 size-[330px] rounded-full bg-[#e87928]/10 blur-3xl" />
            <div className="relative z-10">
              <Link to="/" className="inline-flex items-center gap-3" aria-label="Strap home">
                <span className="flex size-10 items-center justify-center rounded-xl bg-[#f6f2eb]">
                  <span className="size-3.5 rotate-45 rounded-[3px] bg-[#e87928]" />
                </span>
                <span className="font-display text-xl font-bold tracking-[-.06em]">STRAP<span className="text-[#f28a32]">.</span></span>
              </Link>
              <div className="mt-24 max-w-sm">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.18em] text-[#d9cfc2]">
                  <span className="size-1.5 rounded-full bg-[#f28a32]" /> Made for independent business
                </span>
                <h2 className="mt-6 font-display text-[clamp(2.7rem,4vw,4.2rem)] font-semibold leading-[.98] tracking-[-.065em]">Less admin.<br />More <span className="text-[#f28a32]">business.</span></h2>
                <p className="mt-5 max-w-[300px] text-sm leading-6 text-[#c5bdb2]">A clearer way to keep track of sales, stock, and the everyday work that keeps your shop moving.</p>
              </div>
            </div>
            <div className="relative z-10">
              <div className="mb-6 grid grid-cols-3 gap-2">
                {[
                  { number: "01", label: "Track sales" },
                  { number: "02", label: "Manage stock" },
                  { number: "03", label: "Stay in control" },
                ].map((item) => (
                  <div key={item.number} className="rounded-xl border border-white/[.09] bg-white/[.035] p-3">
                    <span className="text-[10px] font-semibold tracking-[.12em] text-[#f28a32]">{item.number}</span>
                    <p className="mt-2 text-[11px] font-medium leading-4 text-[#e7dfd5]">{item.label}</p>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-[#9d958a]">A calmer workspace for the way you work.</p>
            </div>
          </aside>

          <section className="flex min-w-0 items-center justify-center px-4 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-10 xl:px-14">
            <div className="w-full max-w-[390px]">
              <div className="mb-6 sm:mb-7">
                <div className="mb-4 flex size-10 items-center justify-center rounded-xl border border-[#eee5d9] bg-[#faf6ef] text-[#a65318] dark:border-[#49382b] dark:bg-[#30251d] dark:text-[#f3a15c]">
                  <LockKeyhole className="size-[17px]" />
                </div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[.2em] text-[#c16b2b] dark:text-[#f3a15c]">{mode === "signup" ? "Get started" : mode === "reset" || mode === "recover" ? "Account recovery" : "Your workspace awaits"}</p>
                <h1 className="font-display text-[clamp(2rem,7vw,2.7rem)] font-semibold leading-[1.02] tracking-[-.065em] text-[#201d19] dark:text-[#f6f2eb]">{title}</h1>
                <p className="mt-3 max-w-[320px] text-[13px] leading-5 text-[#82796f] dark:text-[#b0a79d]">{subtitle}</p>
              </div>

              {(mode === "signin" || mode === "signup") && (
                <>
                  <button type="button" disabled aria-disabled="true" className="relative flex h-12 w-full cursor-not-allowed items-center justify-center gap-3 rounded-xl border border-[#e7e1d9] bg-white px-3 text-sm font-semibold text-[#514b44] opacity-90 dark:border-[#403a34] dark:bg-[#211f1c] dark:text-[#ded7cd]">
                    <svg aria-hidden="true" viewBox="0 0 48 48" className="size-[19px] shrink-0">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" transform="translate(0 4)" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 38.03 46.98 31.93 46.98 24.55Z" />
                      <path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.9 23.9 0 0 0 0 21.56l7.98-6.19Z" transform="translate(0 4)" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.44-4.88 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" transform="translate(0 -1)" />
                    </svg>
                    <span>Continue with Google</span>
                    <span className="absolute -right-1 -top-2 rounded-full border border-[#f0d8ad] bg-[#fff6e7] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[.08em] text-[#8e4d17] dark:border-[#624326] dark:bg-[#3b2b1c] dark:text-[#ffc58b]">Coming soon</span>
                  </button>
                  <div className="my-5 flex items-center gap-3" aria-hidden="true">
                    <span className="h-px flex-1 bg-[#e9e3db] dark:bg-[#3a3530]" />
                    <span className="text-[10px] font-semibold uppercase tracking-[.15em] text-[#a39a90] dark:text-[#92887e]">or continue with email</span>
                    <span className="h-px flex-1 bg-[#e9e3db] dark:bg-[#3a3530]" />
                  </div>
                </>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs font-semibold text-[#514b44] dark:text-[#ded7cd]">Full name</Label>
                    <Input id="name" value={fullName} onChange={(event) => setFullName(event.target.value)} className="h-11 rounded-xl border-[#e7e1d9] bg-[#fcfbf9] px-3.5 text-sm shadow-none focus-visible:ring-2 focus-visible:ring-[#e87928]/25 dark:border-[#403a34] dark:bg-[#211f1c] dark:text-[#f6f2eb]" autoComplete="name" maxLength={120} required />
                  </div>
                )}
                {mode !== "recover" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold text-[#514b44] dark:text-[#ded7cd]">Email address</Label>
                    <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 rounded-xl border-[#e7e1d9] bg-[#fcfbf9] px-3.5 text-[16px] shadow-none focus-visible:ring-2 focus-visible:ring-[#e87928]/25 dark:border-[#403a34] dark:bg-[#211f1c] dark:text-[#f6f2eb]" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} placeholder="you@yourbusiness.com" required />
                  </div>
                )}
                {mode !== "reset" && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="password" className="text-xs font-semibold text-[#514b44] dark:text-[#ded7cd]">{mode === "recover" ? "New password" : "Password"}</Label>
                      {mode === "signin" && <button type="button" className="min-h-8 shrink-0 px-1 text-xs font-semibold text-[#a65318] hover:text-[#7d3d12] dark:text-[#f3a15c] dark:hover:text-[#ffc58b]" onClick={() => { setMode("reset"); setNotice(null); }}>Forgot password?</button>}
                    </div>
                    <div className="relative">
                      <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 rounded-xl border-[#e7e1d9] bg-[#fcfbf9] px-3.5 pr-12 text-[16px] shadow-none focus-visible:ring-2 focus-visible:ring-[#e87928]/25 dark:border-[#403a34] dark:bg-[#211f1c] dark:text-[#f6f2eb]" autoComplete={mode === "signin" ? "current-password" : "new-password"} placeholder="••••••••" required />
                      <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#91877c] hover:bg-black/[.04] hover:text-[#201d19] dark:text-[#aaa198] dark:hover:bg-white/[.06] dark:hover:text-white" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
                    </div>
                  </div>
                )}
                {mode === "signup" && (
                  <label className="flex items-start gap-3 text-xs leading-5 text-[#82796f] dark:text-[#b0a79d]">
                    <Checkbox checked={accepted} onCheckedChange={(value) => setAccepted(value === true)} className="mt-0.5 size-4 rounded-[5px] border-[#cfc5b8] data-[state=checked]:border-[#d96b1b] data-[state=checked]:bg-[#d96b1b]" aria-label="Accept terms and privacy policy" />
                    <span>I agree to the <Link to="/terms" className="font-semibold text-[#514b44] underline underline-offset-2 dark:text-[#ded7cd]">Terms</Link> and <Link to="/privacy" className="font-semibold text-[#514b44] underline underline-offset-2 dark:text-[#ded7cd]">Privacy Policy</Link>.</span>
                  </label>
                )}
                {notice && <div className="rounded-xl border border-emerald-700/15 bg-emerald-50 px-3.5 py-3 text-sm leading-5 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-950/40 dark:text-emerald-200">{notice}</div>}
                <Button type="submit" disabled={busy} className="group h-11 w-full rounded-xl bg-[#d96b1b] text-sm font-semibold text-white shadow-[0_5px_12px_-6px_rgba(217,107,27,.65)] transition-colors hover:bg-[#bf5912] focus-visible:ring-2 focus-visible:ring-[#e87928]/40 focus-visible:ring-offset-2 dark:bg-[#e87928] dark:text-[#21150c] dark:hover:bg-[#f28a32] dark:focus-visible:ring-offset-[#191817]">
                  {busy ? "Please wait…" : mode === "signin" ? "Continue with email" : mode === "signup" ? "Create your shop" : mode === "reset" ? "Send reset link" : "Update password"}
                  {!busy && <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-0.5" />}
                </Button>
              </form>

              {(mode === "signin" || mode === "signup") && (
                <p className="mt-5 text-center text-sm text-[#82796f] dark:text-[#b0a79d]">
                  {mode === "signin" ? "New to Strap?" : "Already have an account?"}{" "}
                  <button type="button" className="min-h-8 px-1 font-semibold text-[#a65318] underline underline-offset-4 hover:text-[#7d3d12] dark:text-[#f3a15c] dark:hover:text-[#ffc58b]" onClick={() => { setMode(switchMode); setNotice(null); }}>
                    {mode === "signin" ? "Create your shop" : "Sign in"}
                  </button>
                </p>
              )}
              {(mode === "reset" || mode === "recover") && <button type="button" className="mt-5 flex min-h-9 w-full items-center justify-center text-sm font-semibold text-[#82796f] hover:text-[#201d19] dark:text-[#b0a79d] dark:hover:text-[#f6f2eb]" onClick={() => { setMode("signin"); setNotice(null); setPassword(""); }}>Back to sign in</button>}
              <div className="mt-6 border-t border-[#eee8e0] pt-4 text-center dark:border-[#37322d]">
                <p className="text-[10px] leading-5 text-[#a39a90] dark:text-[#92887e]">By continuing, you agree to use Strap responsibly.</p>
                <p className="mt-1 text-[10px] text-[#b0a79d] dark:text-[#7f766d]">Simple commerce, thoughtfully made.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

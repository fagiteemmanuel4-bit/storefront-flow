diff --git a/src/components/auth/AuthBrand.tsx b/src/components/auth/AuthBrand.tsx
new file mode 100644
index 0000000..cea6aa2
--- /dev/null
+++ b/src/components/auth/AuthBrand.tsx
@@ -0,0 +1,34 @@
+import { Link } from "@tanstack/react-router";
+
+/** Dark brand panel for the auth screens. On phones it shrinks to a slim logo bar (see strap-auth.css). */
+export function AuthBrand() {
+  return (
+    <section className="sa-l">
+      <svg
+        className="sa-ring"
+        aria-hidden="true"
+        viewBox="0 0 700 700"
+        fill="none"
+        stroke="#C6F432"
+        strokeWidth="2"
+      >
+        <circle cx="350" cy="350" r="60" />
+        <circle cx="350" cy="350" r="120" strokeOpacity=".7" />
+        <circle cx="350" cy="350" r="180" strokeOpacity=".5" />
+        <circle cx="350" cy="350" r="240" strokeOpacity=".32" />
+        <circle cx="350" cy="350" r="300" strokeOpacity=".18" />
+        <circle cx="350" cy="110" r="9" fill="#C6F432" stroke="none" />
+        <circle cx="562" cy="472" r="9" fill="#C6F432" stroke="none" />
+      </svg>
+      <Link to="/" className="sa-logo" aria-label="Strap home">
+        <span className="sa-dot" />
+        Strap
+      </Link>
+      <div>
+        <h2>Run the shop. Don’t run after the paperwork.</h2>
+        <p className="sa-lead">Your business deserves a system you can trust.</p>
+      </div>
+      <small>© 2026 Strap by Kryonara</small>
+    </section>
+  );
+}
diff --git a/src/routes/auth.tsx b/src/routes/auth.tsx
index 1b9353a..da96067 100644
--- a/src/routes/auth.tsx
+++ b/src/routes/auth.tsx
@@ -1,14 +1,12 @@
 import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
 import { useEffect, useState } from "react";
-import { ArrowRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
+import { Eye, EyeOff } from "lucide-react";
 import { toast } from "sonner";
 import { z } from "zod";
 import { supabase } from "@/integrations/supabase/client";
 import { errorMessage } from "@/lib/format";
-import { Button } from "@/components/ui/button";
-import { Input } from "@/components/ui/input";
-import { Label } from "@/components/ui/label";
-import { Checkbox } from "@/components/ui/checkbox";
+import { AuthBrand } from "@/components/auth/AuthBrand";
+import "@/strap-auth.css";
 
 export const Route = createFileRoute("/auth")({ ssr: false, head: () => ({ meta: [{ title: "Sign in or create your shop — Strap" }, { name: "description", content: "Sign in to Strap or create an account for your shop." }] }), component: AuthPage });
 const emailSchema = z.string().trim().email("Enter a valid email address").max(255);
@@ -25,143 +23,67 @@ function AuthPage() {
   const [fullName, setFullName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [accepted, setAccepted] = useState(false); const [showPassword, setShowPassword] = useState(false); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState<string | null>(null);
   useEffect(() => { const params = new URLSearchParams(window.location.search); if (params.get("mode") === "recover" || window.location.hash.includes("type=recovery")) { setMode("recover"); return; } let cancelled = false; void supabase.auth.getUser().then(({ data }) => { if (!cancelled && data.user) void navigate({ to: "/pos", replace: true }); }); return () => { cancelled = true; }; }, [navigate]);
   async function handleSubmit(event: React.FormEvent) { event.preventDefault(); if (mode !== "recover") { const parsedEmail = emailSchema.safeParse(normalizeEmail(email)); if (!parsedEmail.success) { toast.error(parsedEmail.error.issues[0]!.message); return; } const normalizedEmail = parsedEmail.data; if (mode === "reset") { setBusy(true); setNotice(null); try { const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo: `${window.location.origin}/verified?kind=password&next=${encodeURIComponent("/auth?mode=recover")}` }); if (error) throw new Error(error.message); setNotice("If an account exists for this email, we sent a secure password-reset link. Open it to continue."); } catch (error) { toast.error(errorMessage(error, "We couldn't send that reset link.")); } finally { setBusy(false); } return; } const parsedPassword = passwordSchema.safeParse(password); if (!parsedPassword.success) { toast.error(parsedPassword.error.issues[0]!.message); return; } let validatedName: string | undefined; if (mode === "signup") { const parsedName = nameSchema.safeParse(fullName); if (!parsedName.success) { toast.error(parsedName.error.issues[0]!.message); return; } validatedName = parsedName.data; if (!accepted) { toast.error("Please accept the Terms and Privacy Policy to continue."); return; } } setBusy(true); setNotice(null); try { if (mode === "signup") { const { data, error } = await supabase.auth.signUp({ email: normalizedEmail, password: parsedPassword.data, options: { emailRedirectTo: verificationUrl(normalizedEmail), data: { full_name: validatedName } } }); if (error) throw new Error(error.message); if (!data.user) throw new Error("Strap couldn't create the account. Please try again."); sessionStorage.setItem("strap_otp_email", normalizedEmail); sessionStorage.setItem("strap_otp_flow", "signup"); await navigate({ to: "/verify-email", search: { email: normalizedEmail }, replace: true }); return; } const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password: parsedPassword.data }); if (error) { if (error.message.toLowerCase().includes("email not confirmed")) { await requestLoginOtp(normalizedEmail); sessionStorage.setItem("strap_otp_email", normalizedEmail); sessionStorage.setItem("strap_otp_flow", "signin"); void navigate({ to: "/verify-email", search: { email: normalizedEmail }, replace: true }); return; } throw new Error(error.message); } if (!data.session || !data.user) throw new Error("Sign in did not complete. Please try again."); await supabase.auth.signOut(); await requestLoginOtp(normalizedEmail); sessionStorage.setItem("strap_otp_email", normalizedEmail); sessionStorage.setItem("strap_otp_flow", "signin"); void navigate({ to: "/verify-email", search: { email: normalizedEmail }, replace: true }); } catch (error) { toast.error(errorMessage(error, "That didn't work. Please check your details and try again.")); } finally { setBusy(false); } return; } const parsedPassword = passwordSchema.safeParse(password); if (!parsedPassword.success) { toast.error(parsedPassword.error.issues[0]!.message); return; } setBusy(true); setNotice(null); try { const { error } = await supabase.auth.updateUser({ password: parsedPassword.data }); if (error) throw new Error(error.message); await supabase.auth.signOut(); setNotice("Your password has been updated. You can now sign in with the new password."); setPassword(""); setMode("signin"); } catch (error) { toast.error(errorMessage(error, "We couldn't update your password.")); } finally { setBusy(false); } }
-  const title = mode === "signin" ? "Welcome back." : mode === "signup" ? "Build your shop." : mode === "reset" ? "Reset your password." : "Choose a new password."; const subtitle = mode === "signin" ? "Sign in to keep your store moving." : mode === "signup" ? "A calmer way to run your business." : mode === "reset" ? "We'll send a secure link to your email." : "Finish your password change securely."; const switchMode = mode === "signin" ? "signup" : "signin";
+  const title = mode === "signin" ? "Log in" : mode === "signup" ? "Create your shop" : mode === "reset" ? "Reset your password" : "Choose a new password"; const subtitle = mode === "signin" ? "Welcome back. Enter your details to continue." : mode === "signup" ? "Set up your Strap account in a minute." : mode === "reset" ? "We’ll send a secure reset link to your email." : "Finish your password change securely."; const switchMode = mode === "signin" ? "signup" : "signin";
   return (
-    <main className="min-h-[100dvh] bg-[#faf8f5] px-3 py-4 text-[#201d19] transition-colors dark:bg-[#10100f] dark:text-[#f6f2eb] sm:px-6 sm:py-6 lg:flex lg:items-center lg:justify-center">
-      <div className="mx-auto w-full max-w-[1000px]">
-        <div className="mb-5 flex items-center justify-between px-1 lg:hidden">
-          <Link to="/" className="flex items-center gap-2.5" aria-label="Strap home">
-            <span className="flex size-8 items-center justify-center rounded-[10px] bg-[#201d19] dark:bg-[#f6f2eb]">
-              <span className="size-3 rotate-45 rounded-[2px] bg-[#f28a32] dark:bg-[#d96b1b]" />
-            </span>
-            <span className="font-display text-lg font-bold tracking-[-.06em] dark:text-[#f6f2eb]">STRAP<span className="text-[#e87928]">.</span></span>
-          </Link>
-          <span className="text-[11px] font-medium text-[#8b8379] dark:text-[#aaa198]">Shop management, made simpler</span>
-        </div>
+    <main className="sa">
+      <AuthBrand />
+      <section className="sa-r">
+        <div className="sa-box">
+          <h1>{title}</h1>
+          <p className="sa-mut">{subtitle}</p>
 
-        <div className="grid overflow-hidden rounded-[26px] border border-[#e8e1d8] bg-white shadow-[0_24px_80px_-48px_rgba(48,35,21,.3)] dark:border-[#34302b] dark:bg-[#191817] sm:rounded-[30px] lg:min-h-[650px] lg:grid-cols-[.9fr_1.1fr]">
-          <aside className="relative hidden overflow-hidden bg-[#211f1b] p-9 text-[#f8f4ed] dark:bg-[#24211e] lg:flex lg:flex-col lg:justify-between xl:p-11">
-            <div className="pointer-events-none absolute -right-24 -top-20 size-[340px] rounded-full border border-white/[.07]" />
-            <div className="pointer-events-none absolute -right-12 -top-8 size-[245px] rounded-full border border-white/[.08]" />
-            <div className="pointer-events-none absolute -bottom-28 -left-24 size-[330px] rounded-full bg-[#e87928]/10 blur-3xl" />
-            <div className="relative z-10">
-              <Link to="/" className="inline-flex items-center gap-3" aria-label="Strap home">
-                <span className="flex size-10 items-center justify-center rounded-xl bg-[#f6f2eb]">
-                  <span className="size-3.5 rotate-45 rounded-[3px] bg-[#e87928]" />
-                </span>
-                <span className="font-display text-xl font-bold tracking-[-.06em]">STRAP<span className="text-[#f28a32]">.</span></span>
-              </Link>
-              <div className="mt-24 max-w-sm">
-                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.18em] text-[#d9cfc2]">
-                  <span className="size-1.5 rounded-full bg-[#f28a32]" /> Made for independent business
-                </span>
-                <h2 className="mt-6 font-display text-[clamp(2.7rem,4vw,4.2rem)] font-semibold leading-[.98] tracking-[-.065em]">Less admin.<br />More <span className="text-[#f28a32]">business.</span></h2>
-                <p className="mt-5 max-w-[300px] text-sm leading-6 text-[#c5bdb2]">A clearer way to keep track of sales, stock, and the everyday work that keeps your shop moving.</p>
+          <form onSubmit={handleSubmit} className="sa-fm">
+            {mode === "signup" && (
+              <div className="sa-f">
+                <label htmlFor="name">Full name</label>
+                <input id="name" className="sa-in" value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" maxLength={120} placeholder="Your full name" required />
               </div>
-            </div>
-            <div className="relative z-10">
-              <div className="mb-6 grid grid-cols-3 gap-2">
-                {[
-                  { number: "01", label: "Track sales" },
-                  { number: "02", label: "Manage stock" },
-                  { number: "03", label: "Stay in control" },
-                ].map((item) => (
-                  <div key={item.number} className="rounded-xl border border-white/[.09] bg-white/[.035] p-3">
-                    <span className="text-[10px] font-semibold tracking-[.12em] text-[#f28a32]">{item.number}</span>
-                    <p className="mt-2 text-[11px] font-medium leading-4 text-[#e7dfd5]">{item.label}</p>
-                  </div>
-                ))}
+            )}
+            {mode !== "recover" && (
+              <div className="sa-f">
+                <label htmlFor="email">Email</label>
+                <input id="email" type="email" className="sa-in" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} placeholder="you@example.com" required />
               </div>
-              <p className="text-[11px] text-[#9d958a]">A calmer workspace for the way you work.</p>
-            </div>
-          </aside>
-
-          <section className="flex min-w-0 items-center justify-center px-4 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-10 xl:px-14">
-            <div className="w-full max-w-[390px]">
-              <div className="mb-6 sm:mb-7">
-                <div className="mb-4 flex size-10 items-center justify-center rounded-xl border border-[#eee5d9] bg-[#faf6ef] text-[#a65318] dark:border-[#49382b] dark:bg-[#30251d] dark:text-[#f3a15c]">
-                  <LockKeyhole className="size-[17px]" />
+            )}
+            {mode !== "reset" && (
+              <div className="sa-f">
+                <div className="sa-rowl">
+                  <label htmlFor="password">{mode === "recover" ? "New password" : "Password"}</label>
+                  {mode === "signin" && <button type="button" className="sa-lk sm" onClick={() => { setMode("reset"); setNotice(null); }}>Forgot password?</button>}
+                </div>
+                <div className="sa-pw">
+                  <input id="password" type={showPassword ? "text" : "password"} className="sa-in" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "signin" ? "current-password" : "new-password"} placeholder="Enter your password" required />
+                  <button type="button" className="sa-eye" onClick={() => setShowPassword((value) => !value)} aria-pressed={showPassword} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={22} aria-hidden="true" /> : <Eye size={22} aria-hidden="true" />}</button>
                 </div>
-                <p className="mb-2 text-[10px] font-bold uppercase tracking-[.2em] text-[#c16b2b] dark:text-[#f3a15c]">{mode === "signup" ? "Get started" : mode === "reset" || mode === "recover" ? "Account recovery" : "Your workspace awaits"}</p>
-                <h1 className="font-display text-[clamp(2rem,7vw,2.7rem)] font-semibold leading-[1.02] tracking-[-.065em] text-[#201d19] dark:text-[#f6f2eb]">{title}</h1>
-                <p className="mt-3 max-w-[320px] text-[13px] leading-5 text-[#82796f] dark:text-[#b0a79d]">{subtitle}</p>
               </div>
+            )}
+            {mode === "signup" && (
+              <label className="sa-ck">
+                <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
+                <span>I agree to the <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.</span>
+              </label>
+            )}
+            {notice && <div className="sa-notice" role="status">{notice}</div>}
+            <button type="submit" disabled={busy} className="sa-b p">
+              {busy ? "Please wait…" : mode === "signin" ? "Log in" : mode === "signup" ? "Create your shop" : mode === "reset" ? "Send reset link" : "Update password"}
+            </button>
+          </form>
 
-              {(mode === "signin" || mode === "signup") && (
-                <>
-                  <button type="button" disabled aria-disabled="true" className="relative flex h-12 w-full cursor-not-allowed items-center justify-center gap-3 rounded-xl border border-[#e7e1d9] bg-white px-3 text-sm font-semibold text-[#514b44] opacity-90 dark:border-[#403a34] dark:bg-[#211f1c] dark:text-[#ded7cd]">
-                    <svg aria-hidden="true" viewBox="0 0 48 48" className="size-[19px] shrink-0">
-                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" transform="translate(0 4)" />
-                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 38.03 46.98 31.93 46.98 24.55Z" />
-                      <path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.9 23.9 0 0 0 0 21.56l7.98-6.19Z" transform="translate(0 4)" />
-                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.44-4.88 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" transform="translate(0 -1)" />
-                    </svg>
-                    <span>Continue with Google</span>
-                    <span className="absolute -right-1 -top-2 rounded-full border border-[#f0d8ad] bg-[#fff6e7] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[.08em] text-[#8e4d17] dark:border-[#624326] dark:bg-[#3b2b1c] dark:text-[#ffc58b]">Coming soon</span>
-                  </button>
-                  <div className="my-5 flex items-center gap-3" aria-hidden="true">
-                    <span className="h-px flex-1 bg-[#e9e3db] dark:bg-[#3a3530]" />
-                    <span className="text-[10px] font-semibold uppercase tracking-[.15em] text-[#a39a90] dark:text-[#92887e]">or continue with email</span>
-                    <span className="h-px flex-1 bg-[#e9e3db] dark:bg-[#3a3530]" />
-                  </div>
-                </>
-              )}
-
-              <form onSubmit={handleSubmit} className="space-y-4">
-                {mode === "signup" && (
-                  <div className="space-y-1.5">
-                    <Label htmlFor="name" className="text-xs font-semibold text-[#514b44] dark:text-[#ded7cd]">Full name</Label>
-                    <Input id="name" value={fullName} onChange={(event) => setFullName(event.target.value)} className="h-11 rounded-xl border-[#e7e1d9] bg-[#fcfbf9] px-3.5 text-sm shadow-none focus-visible:ring-2 focus-visible:ring-[#e87928]/25 dark:border-[#403a34] dark:bg-[#211f1c] dark:text-[#f6f2eb]" autoComplete="name" maxLength={120} required />
-                  </div>
-                )}
-                {mode !== "recover" && (
-                  <div className="space-y-1.5">
-                    <Label htmlFor="email" className="text-xs font-semibold text-[#514b44] dark:text-[#ded7cd]">Email address</Label>
-                    <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 rounded-xl border-[#e7e1d9] bg-[#fcfbf9] px-3.5 text-[16px] shadow-none focus-visible:ring-2 focus-visible:ring-[#e87928]/25 dark:border-[#403a34] dark:bg-[#211f1c] dark:text-[#f6f2eb]" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} placeholder="you@yourbusiness.com" required />
-                  </div>
-                )}
-                {mode !== "reset" && (
-                  <div className="space-y-1.5">
-                    <div className="flex items-center justify-between gap-3">
-                      <Label htmlFor="password" className="text-xs font-semibold text-[#514b44] dark:text-[#ded7cd]">{mode === "recover" ? "New password" : "Password"}</Label>
-                      {mode === "signin" && <button type="button" className="min-h-8 shrink-0 px-1 text-xs font-semibold text-[#a65318] hover:text-[#7d3d12] dark:text-[#f3a15c] dark:hover:text-[#ffc58b]" onClick={() => { setMode("reset"); setNotice(null); }}>Forgot password?</button>}
-                    </div>
-                    <div className="relative">
-                      <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 rounded-xl border-[#e7e1d9] bg-[#fcfbf9] px-3.5 pr-12 text-[16px] shadow-none focus-visible:ring-2 focus-visible:ring-[#e87928]/25 dark:border-[#403a34] dark:bg-[#211f1c] dark:text-[#f6f2eb]" autoComplete={mode === "signin" ? "current-password" : "new-password"} placeholder="••••••••" required />
-                      <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#91877c] hover:bg-black/[.04] hover:text-[#201d19] dark:text-[#aaa198] dark:hover:bg-white/[.06] dark:hover:text-white" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
-                    </div>
-                  </div>
-                )}
-                {mode === "signup" && (
-                  <label className="flex items-start gap-3 text-xs leading-5 text-[#82796f] dark:text-[#b0a79d]">
-                    <Checkbox checked={accepted} onCheckedChange={(value) => setAccepted(value === true)} className="mt-0.5 size-4 rounded-[5px] border-[#cfc5b8] data-[state=checked]:border-[#d96b1b] data-[state=checked]:bg-[#d96b1b]" aria-label="Accept terms and privacy policy" />
-                    <span>I agree to the <Link to="/terms" className="font-semibold text-[#514b44] underline underline-offset-2 dark:text-[#ded7cd]">Terms</Link> and <Link to="/privacy" className="font-semibold text-[#514b44] underline underline-offset-2 dark:text-[#ded7cd]">Privacy Policy</Link>.</span>
-                  </label>
-                )}
-                {notice && <div className="rounded-xl border border-emerald-700/15 bg-emerald-50 px-3.5 py-3 text-sm leading-5 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-950/40 dark:text-emerald-200">{notice}</div>}
-                <Button type="submit" disabled={busy} className="group h-11 w-full rounded-xl bg-[#d96b1b] text-sm font-semibold text-white shadow-[0_5px_12px_-6px_rgba(217,107,27,.65)] transition-colors hover:bg-[#bf5912] focus-visible:ring-2 focus-visible:ring-[#e87928]/40 focus-visible:ring-offset-2 dark:bg-[#e87928] dark:text-[#21150c] dark:hover:bg-[#f28a32] dark:focus-visible:ring-offset-[#191817]">
-                  {busy ? "Please wait…" : mode === "signin" ? "Continue with email" : mode === "signup" ? "Create your shop" : mode === "reset" ? "Send reset link" : "Update password"}
-                  {!busy && <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-0.5" />}
-                </Button>
-              </form>
-
-              {(mode === "signin" || mode === "signup") && (
-                <p className="mt-5 text-center text-sm text-[#82796f] dark:text-[#b0a79d]">
-                  {mode === "signin" ? "New to Strap?" : "Already have an account?"}{" "}
-                  <button type="button" className="min-h-8 px-1 font-semibold text-[#a65318] underline underline-offset-4 hover:text-[#7d3d12] dark:text-[#f3a15c] dark:hover:text-[#ffc58b]" onClick={() => { setMode(switchMode); setNotice(null); }}>
-                    {mode === "signin" ? "Create your shop" : "Sign in"}
-                  </button>
-                </p>
-              )}
-              {(mode === "reset" || mode === "recover") && <button type="button" className="mt-5 flex min-h-9 w-full items-center justify-center text-sm font-semibold text-[#82796f] hover:text-[#201d19] dark:text-[#b0a79d] dark:hover:text-[#f6f2eb]" onClick={() => { setMode("signin"); setNotice(null); setPassword(""); }}>Back to sign in</button>}
-              <div className="mt-6 border-t border-[#eee8e0] pt-4 text-center dark:border-[#37322d]">
-                <p className="text-[10px] leading-5 text-[#a39a90] dark:text-[#92887e]">By continuing, you agree to use Strap responsibly.</p>
-                <p className="mt-1 text-[10px] text-[#b0a79d] dark:text-[#7f766d]">Simple commerce, thoughtfully made.</p>
-              </div>
-            </div>
-          </section>
+          {(mode === "signin" || mode === "signup") && (
+            <>
+              <div className="sa-or" aria-hidden="true">or</div>
+              <button type="button" disabled aria-disabled="true" className="sa-b">Continue with Google<span className="sa-soon">Coming soon</span></button>
+              <p className="sa-alt">
+                {mode === "signin" ? "New to Strap?" : "Already have an account?"}{" "}
+                <button type="button" className="sa-lk" onClick={() => { setMode(switchMode); setNotice(null); }}>
+                  {mode === "signin" ? "Create an account" : "Log in"}
+                </button>
+              </p>
+            </>
+          )}
+          {(mode === "reset" || mode === "recover") && <p className="sa-alt"><button type="button" className="sa-lk" onClick={() => { setMode("signin"); setNotice(null); setPassword(""); }}>Back to log in</button></p>}
         </div>
-      </div>
+      </section>
     </main>
   );
 }
diff --git a/src/routes/verify-email.tsx b/src/routes/verify-email.tsx
index c0ce3f7..1ae34ad 100644
--- a/src/routes/verify-email.tsx
+++ b/src/routes/verify-email.tsx
@@ -1,14 +1,20 @@
 import { useEffect, useRef, useState } from "react";
 import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
-import { CheckCircle2, Clock3, Mail, RefreshCw, ShieldCheck, TriangleAlert } from "lucide-react";
 import { supabase } from "@/integrations/supabase/client";
-import { Button } from "@/components/ui/button";
-import { Input } from "@/components/ui/input";
-import { Label } from "@/components/ui/label";
+import { AuthBrand } from "@/components/auth/AuthBrand";
+import "@/strap-auth.css";
 
 export const Route = createFileRoute("/verify-email")({
   ssr: false,
-  head: () => ({ meta: [{ title: "Verify your email — Strap" }, { name: "description", content: "Confirm your email with a secure one-time code to access Strap." }] }),
+  head: () => ({
+    meta: [
+      { title: "Verify your email — Strap" },
+      {
+        name: "description",
+        content: "Confirm your email with a secure one-time code to access Strap.",
+      },
+    ],
+  }),
   component: VerifyEmailPage,
 });
 
@@ -29,6 +35,7 @@ function VerifyEmailPage() {
   const [cooldown, setCooldown] = useState(0);
   const [flow, setFlow] = useState<"signup" | "signin">("signin");
   const verifyingRef = useRef(false);
+  const boxRefs = useRef<(HTMLInputElement | null)[]>([]);
 
   useEffect(() => {
     const storedEmail = sessionStorage.getItem("strap_otp_email");
@@ -41,7 +48,8 @@ function VerifyEmailPage() {
       const params = new URLSearchParams(window.location.search);
       const codeParam = params.get("code");
       const tokenHash = params.get("token_hash");
-      const hasVerificationHash = window.location.hash.includes("type=signup") || window.location.hash.includes("type=email");
+      const hasVerificationHash =
+        window.location.hash.includes("type=signup") || window.location.hash.includes("type=email");
       if (!codeParam && !tokenHash && !hasVerificationHash) return;
       setState("checking");
       setMessage("");
@@ -54,12 +62,19 @@ function VerifyEmailPage() {
           if (error) throw error;
         } else await new Promise((resolve) => window.setTimeout(resolve, 350));
         const { data } = await supabase.auth.getUser();
-        if (!data.user?.email_confirmed_at) throw new Error("Your email could not be confirmed. The verification link may have expired.");
+        if (!data.user?.email_confirmed_at)
+          throw new Error(
+            "Your email could not be confirmed. The verification link may have expired.",
+          );
         if (!active) return;
         sessionStorage.removeItem("strap_otp_email");
         sessionStorage.removeItem("strap_otp_flow");
         setState("success");
-        setMessage(flow === "signup" ? "Your email is verified. Your Strap account is ready." : "Your sign-in is verified. Opening Strap…");
+        setMessage(
+          flow === "signup"
+            ? "Your email is verified. Your Strap account is ready."
+            : "Your sign-in is verified. Opening Strap…",
+        );
         if (flow === "signin") {
           window.setTimeout(() => void navigate({ to: "/pos", replace: true }), 450);
         } else {
@@ -68,11 +83,17 @@ function VerifyEmailPage() {
       } catch (error) {
         if (!active) return;
         setState("error");
-        setMessage(error instanceof Error ? error.message : "This verification link is invalid or has expired. Request a fresh code below.");
+        setMessage(
+          error instanceof Error
+            ? error.message
+            : "This verification link is invalid or has expired. Request a fresh code below.",
+        );
       }
     };
     void finishLink();
-    return () => { active = false; };
+    return () => {
+      active = false;
+    };
   }, [email, flow, navigate]);
 
   useEffect(() => {
@@ -102,15 +123,26 @@ function VerifyEmailPage() {
     setLoading(true);
     setState("verifying");
     try {
-      const { data, error } = await supabase.auth.verifyOtp({ email: normalizedEmail, token: normalizedCode, type: "email" });
+      const { data, error } = await supabase.auth.verifyOtp({
+        email: normalizedEmail,
+        token: normalizedCode,
+        type: "email",
+      });
       if (error) throw error;
-      if (!data.user?.email_confirmed_at) throw new Error("The code was accepted, but your email is not confirmed yet. Please request a fresh code.");
+      if (!data.user?.email_confirmed_at)
+        throw new Error(
+          "The code was accepted, but your email is not confirmed yet. Please request a fresh code.",
+        );
 
       sessionStorage.removeItem("strap_otp_email");
       sessionStorage.removeItem("strap_otp_flow");
       setCode("");
       setState("success");
-      setMessage(flow === "signup" ? "Email verified successfully. Your account is ready." : "Email verified successfully. Opening Strap…");
+      setMessage(
+        flow === "signup"
+          ? "Email verified successfully. Your account is ready."
+          : "Email verified successfully. Opening Strap…",
+      );
 
       if (flow === "signin") {
         await navigate({ to: "/pos", replace: true });
@@ -119,7 +151,11 @@ function VerifyEmailPage() {
       }
     } catch (error) {
       setState("error");
-      setMessage(error instanceof Error ? error.message : "The code could not be verified. Request a fresh code and try again.");
+      setMessage(
+        error instanceof Error
+          ? error.message
+          : "The code could not be verified. Request a fresh code and try again.",
+      );
       setCode("");
     } finally {
       setLoading(false);
@@ -138,86 +174,171 @@ function VerifyEmailPage() {
     }
     setResending(true);
     try {
-      const { error } = await supabase.auth.signInWithOtp({ email: normalizedEmail, options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/verify-email?email=${encodeURIComponent(normalizedEmail)}` } });
+      const { error } = await supabase.auth.signInWithOtp({
+        email: normalizedEmail,
+        options: {
+          shouldCreateUser: false,
+          emailRedirectTo: `${window.location.origin}/verify-email?email=${encodeURIComponent(normalizedEmail)}`,
+        },
+      });
       if (error) throw error;
       sessionStorage.setItem("strap_otp_email", normalizedEmail);
       sessionStorage.setItem("strap_otp_flow", flow);
       setCode("");
       setCooldown(RESEND_COOLDOWN_SECONDS);
       setState("waiting");
-      setMessage("A fresh one-time code is on its way. Check your inbox, spam, and promotions folders.");
+      setMessage(
+        "A fresh one-time code is on its way. Check your inbox, spam, and promotions folders.",
+      );
     } catch (error) {
       setState("error");
-      setMessage(error instanceof Error ? error.message : "We couldn't send a new code. Please try again later.");
-    } finally { setResending(false); }
+      setMessage(
+        error instanceof Error
+          ? error.message
+          : "We couldn't send a new code. Please try again later.",
+      );
+    } finally {
+      setResending(false);
+    }
   };
 
   const success = state === "success";
   const checking = state === "checking";
   const verifying = state === "verifying";
+  const boxes = Array.from({ length: OTP_LENGTH }, (_, i) => code[i] ?? "");
+  const focusBox = (i: number) =>
+    boxRefs.current[Math.max(0, Math.min(OTP_LENGTH - 1, i))]?.focus();
+  const setBox = (i: number, raw: string) => {
+    const digits = raw.replace(/\D/g, "");
+    if (!digits) {
+      setCode(code.slice(0, i) + code.slice(i + 1));
+      return;
+    }
+    const next = (code.slice(0, i) + digits + code.slice(i + 1)).slice(0, OTP_LENGTH);
+    setCode(next);
+    focusBox(Math.min(i + digits.length, OTP_LENGTH - 1));
+  };
 
   return (
-    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
-      <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-lift sm:p-8">
-        <div className="text-center">
-          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50">
-            {success ? <CheckCircle2 className="h-6 w-6" /> : checking || verifying ? <ShieldCheck className="h-6 w-6 animate-pulse" /> : <Mail className="h-6 w-6" />}
-          </div>
-          <h1 className="mt-4 text-xl font-semibold tracking-tight">
-            {success ? "Email verified" : checking ? "Confirming email…" : verifying ? "Checking code…" : "Verify your email"}
-          </h1>
-          <p className="mt-2 text-sm leading-5 text-muted-foreground">
-            {success ? message : checking ? "Please wait a moment." : verifying ? "Just a moment while we check your code." : <>Enter the 8-digit code sent to <span className="font-medium text-foreground">{email || "your email address"}</span>.</>}
-          </p>
-        </div>
-
-        {message && !success && !checking && !verifying && (
-          <p className={`mt-4 rounded-xl px-3 py-2.5 text-sm ${state === "error" ? "bg-destructive/10 text-destructive" : "bg-secondary text-muted-foreground"}`} role={state === "error" ? "alert" : "status"}>
-            {message}
-          </p>
-        )}
-
-        {!success && !checking && (
-          <form onSubmit={(event) => void verifyCode(event)} className="mt-5 space-y-3">
-            <Input
-              id="verification-code"
-              autoFocus
-              inputMode="numeric"
-              autoComplete="one-time-code"
-              className="h-14 rounded-2xl text-center text-2xl font-semibold tracking-[0.35em]"
-              value={code}
-              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))}
-              disabled={verifying || loading}
-              placeholder="••••••••"
-              maxLength={OTP_LENGTH}
-              aria-label="8-digit verification code"
-            />
-            <Button type="submit" disabled={loading || code.length !== OTP_LENGTH} className="h-11 w-full rounded-2xl">
-              {loading ? "Verifying…" : "Verify email"}
-            </Button>
-          </form>
-        )}
-
-        {!success && !checking && (
-          <div className="mt-4 text-center">
-            <p className="text-xs text-muted-foreground">Can’t find it? Check your spam folder.</p>
-            <button
-              type="button"
-              disabled={resending || cooldown > 0 || loading}
-              onClick={() => void resend()}
-              className="mt-2 inline-flex min-h-9 items-center justify-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
-            >
-              {resending ? "Sending new code…" : cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
-            </button>
-          </div>
-        )}
-
-        <div className="mt-5 text-center">
-          <Link to="/auth" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
-            {success ? flow === "signup" ? "Go to login" : "Return to Strap" : "Back to login"}
-          </Link>
+    <main className="sa">
+      <AuthBrand />
+      <section className="sa-r">
+        <div className="sa-box">
+          {success ? (
+            <div>
+              <div className="sa-ok">
+                <svg
+                  aria-hidden="true"
+                  width="28"
+                  height="28"
+                  viewBox="0 0 24 24"
+                  fill="none"
+                  stroke="#0E1116"
+                  strokeWidth="2.4"
+                  strokeLinecap="round"
+                  strokeLinejoin="round"
+                >
+                  <path d="M5 12l5 5 9-10" />
+                </svg>
+              </div>
+              <h1>You’re verified</h1>
+              <p className="sa-mut" role="status">
+                {message}
+              </p>
+              <p className="sa-alt">
+                <Link to="/auth" className="sa-b p">
+                  {flow === "signup" ? "Go to log in" : "Return to Strap"}
+                </Link>
+              </p>
+            </div>
+          ) : checking ? (
+            <div>
+              <h1>Confirming email…</h1>
+              <p className="sa-mut" role="status">
+                Please wait a moment.
+              </p>
+            </div>
+          ) : (
+            <div>
+              <h1>{verifying ? "Checking code…" : "Check your email"}</h1>
+              <p className="sa-mut">
+                We sent a {OTP_LENGTH}-digit code to <b>{email || "your email address"}</b>.{" "}
+                <Link to="/auth" className="sa-lk">
+                  Change email
+                </Link>
+              </p>
+              <form onSubmit={(event) => void verifyCode(event)} className="sa-fm">
+                <div className="sa-otp" role="group" aria-label={`${OTP_LENGTH}-digit verification code`}>
+                  {boxes.map((digit, i) => (
+                    <span key={i} style={{ display: "contents" }}>
+                      {i === OTP_LENGTH / 2 && <span className="sep" aria-hidden="true" />}
+                      <input
+                        ref={(el) => {
+                          boxRefs.current[i] = el;
+                        }}
+                        id={i === 0 ? "verification-code" : undefined}
+                        className={`sa-in${digit ? " filled" : ""}`}
+                        value={digit}
+                        inputMode="numeric"
+                        autoComplete={i === 0 ? "one-time-code" : "off"}
+                        autoFocus={i === 0}
+                        disabled={verifying || loading}
+                        aria-label={`Digit ${i + 1} of ${OTP_LENGTH}`}
+                        onChange={(event) => setBox(i, event.target.value)}
+                        onKeyDown={(event) => {
+                          if (event.key === "Backspace" && !digit && i > 0) {
+                            event.preventDefault();
+                            setCode(code.slice(0, i - 1) + code.slice(i));
+                            focusBox(i - 1);
+                          } else if (event.key === "ArrowLeft") focusBox(i - 1);
+                          else if (event.key === "ArrowRight") focusBox(i + 1);
+                        }}
+                        onFocus={(event) => event.target.select()}
+                      />
+                    </span>
+                  ))}
+                </div>
+                {message && (
+                  <div
+                    className={`sa-notice${state === "error" ? " err" : ""}`}
+                    role={state === "error" ? "alert" : "status"}
+                  >
+                    {message}
+                  </div>
+                )}
+                <button
+                  type="submit"
+                  disabled={loading || code.length !== OTP_LENGTH}
+                  className="sa-b p"
+                >
+                  {loading ? "Verifying…" : "Verify and continue"}
+                </button>
+              </form>
+              <p className="sa-alt">
+                Didn’t get the code?{" "}
+                <button
+                  type="button"
+                  disabled={resending || cooldown > 0 || loading}
+                  onClick={() => void resend()}
+                  className="sa-lk"
+                >
+                  {resending
+                    ? "Sending new code…"
+                    : cooldown > 0
+                      ? `Resend code in ${cooldown}s`
+                      : "Resend code"}
+                </button>
+              </p>
+              <p className="sa-alt" style={{ fontSize: 14 }}>
+                Check your spam folder too.
+              </p>
+              <p className="sa-alt">
+                <Link to="/auth">Back to log in</Link>
+              </p>
+            </div>
+          )}
         </div>
-      </div>
+      </section>
     </main>
   );
 }
diff --git a/src/strap-auth.css b/src/strap-auth.css
new file mode 100644
index 0000000..2d14fb4
--- /dev/null
+++ b/src/strap-auth.css
@@ -0,0 +1,417 @@
+/* Strap redesign — auth screens (log in, create shop, reset, verify code).
+ * Scoped to .sa so nothing else in the app is affected. Uses the Phase 1 tokens. */
+
+.sa {
+  --sa-bg: var(--bg, #f7f7f5);
+  --sa-surface: #fff;
+  --sa-line: #d5d8de;
+  --sa-mut: #555c6a;
+  --sa-text: #0e1116;
+  --sa-ph: #6b7280;
+  --sa-btn: #0e1116;
+  --sa-btn-t: #fff;
+  --sa-btn-h: #262c38;
+  --sa-hover: #edeef0;
+  --sa-danger: #b42318;
+  --sa-danger-bg: #ffe9e6;
+  --sa-ok-bg: #eef9c9;
+  display: grid;
+  grid-template-columns: 1.1fr 1fr;
+  min-height: 100dvh;
+  background: var(--sa-bg);
+  color: var(--sa-text);
+  font-family: var(--font-body, Inter, system-ui, sans-serif);
+  font-size: 16px;
+  line-height: 1.55;
+}
+:root.dark .sa {
+  --sa-bg: #0a0d11;
+  --sa-surface: #161b22;
+  --sa-line: #2c3340;
+  --sa-mut: #a3aab8;
+  --sa-text: #f2f4f7;
+  --sa-ph: #8a93a3;
+  --sa-btn: #c6f432;
+  --sa-btn-t: #0e1116;
+  --sa-btn-h: #d6f76a;
+  --sa-hover: #232a35;
+  --sa-danger: #ff8a80;
+  --sa-danger-bg: #3a1b19;
+  --sa-ok-bg: #26310a;
+}
+.sa *,
+.sa *::before,
+.sa *::after {
+  box-sizing: border-box;
+}
+
+/* Brand panel */
+.sa-l {
+  position: relative;
+  overflow: hidden;
+  background: #0e1116;
+  color: #fff;
+  padding: 56px 64px;
+  display: flex;
+  flex-direction: column;
+  justify-content: space-between;
+  gap: 40px;
+}
+.sa-l > * {
+  position: relative;
+}
+.sa-l h2 {
+  font-family: var(--font-display);
+  font-weight: 700;
+  letter-spacing: -0.02em;
+  line-height: 1.08;
+  font-size: clamp(36px, 5vw, 64px);
+  max-width: 520px;
+  margin: 0;
+  color: #fff;
+}
+.sa-lead {
+  color: #b4bac6;
+  font-size: 18px;
+  max-width: 420px;
+  margin: 20px 0 0;
+}
+.sa-l small {
+  color: #9aa1ae;
+  font-size: 13px;
+}
+.sa-ring {
+  position: absolute !important;
+  right: -200px;
+  bottom: -220px;
+  width: 760px;
+  height: 760px;
+  pointer-events: none;
+}
+.sa-logo {
+  display: flex;
+  align-items: center;
+  gap: 10px;
+  width: max-content;
+  color: #fff;
+  text-decoration: none;
+  font: 700 22px var(--font-display);
+  letter-spacing: -0.02em;
+}
+.sa-dot {
+  width: 26px;
+  height: 26px;
+  border: 2px solid #c6f432;
+  border-radius: 50%;
+  display: grid;
+  place-items: center;
+}
+.sa-dot::after {
+  content: "";
+  width: 10px;
+  height: 10px;
+  border-radius: 50%;
+  background: #c6f432;
+}
+
+/* Form side */
+.sa-r {
+  display: flex;
+  align-items: center;
+  justify-content: center;
+  padding: 48px 24px;
+  min-width: 0;
+}
+.sa-box {
+  width: 100%;
+  max-width: 400px;
+}
+.sa-box h1 {
+  font-family: var(--font-display);
+  font-weight: 700;
+  letter-spacing: -0.02em;
+  line-height: 1.08;
+  font-size: 34px;
+  margin: 0 0 8px;
+  color: var(--sa-text);
+}
+.sa-mut {
+  color: var(--sa-mut);
+  margin: 0;
+}
+.sa-box p b {
+  overflow-wrap: anywhere;
+}
+.sa-fm {
+  display: flex;
+  flex-direction: column;
+  gap: 16px;
+  margin: 24px 0;
+}
+.sa-f {
+  display: flex;
+  flex-direction: column;
+  gap: 6px;
+}
+.sa-f label,
+.sa-label {
+  font-weight: 500;
+  font-size: 14px;
+  color: var(--sa-text);
+}
+.sa-rowl {
+  display: flex;
+  justify-content: space-between;
+  align-items: center;
+  gap: 12px;
+}
+
+.sa-in {
+  display: block;
+  width: 100%;
+  min-height: 52px;
+  padding: 12px 16px;
+  border: 1.5px solid var(--sa-line);
+  border-radius: 12px;
+  background: var(--sa-surface);
+  font: 400 16px var(--font-body, Inter, system-ui, sans-serif);
+  color: var(--sa-text);
+  box-shadow: none;
+}
+.sa-in::placeholder {
+  color: var(--sa-ph);
+}
+.sa-in:focus {
+  outline: none;
+  border-color: var(--sa-text);
+  box-shadow: 0 0 0 4px rgba(198, 244, 50, 0.55);
+}
+.sa-pw {
+  position: relative;
+}
+.sa-pw .sa-in {
+  padding-right: 56px;
+}
+.sa-eye {
+  position: absolute;
+  right: 4px;
+  top: 4px;
+  width: 44px;
+  height: 44px;
+  border: 0;
+  background: transparent;
+  border-radius: 10px;
+  cursor: pointer;
+  display: grid;
+  place-items: center;
+  color: var(--sa-text);
+}
+.sa-eye:hover {
+  background: var(--sa-hover);
+}
+
+.sa-b {
+  display: inline-flex;
+  align-items: center;
+  justify-content: center;
+  width: 100%;
+  min-height: 48px;
+  padding: 0 22px;
+  border-radius: 12px;
+  border: 1.5px solid var(--sa-text);
+  background: var(--sa-surface);
+  color: var(--sa-text);
+  font: 600 16px var(--font-body, Inter, system-ui, sans-serif);
+  text-decoration: none;
+  cursor: pointer;
+}
+.sa-b.p {
+  background: var(--sa-btn);
+  border-color: var(--sa-btn);
+  color: var(--sa-btn-t);
+}
+.sa-b.p:hover:not(:disabled) {
+  background: var(--sa-btn-h);
+}
+.sa-b:disabled {
+  opacity: 0.4;
+  cursor: not-allowed;
+}
+
+.sa-lk {
+  background: none;
+  border: 0;
+  padding: 0 4px;
+  min-height: 44px;
+  font: 600 16px var(--font-body, Inter, system-ui, sans-serif);
+  color: var(--sa-text);
+  text-decoration: underline;
+  cursor: pointer;
+}
+.sa-lk.sm {
+  font-size: 14px;
+  font-weight: 500;
+  text-decoration: none;
+  min-height: 32px;
+}
+.sa-lk:disabled {
+  color: var(--sa-mut);
+  text-decoration: none;
+  cursor: default;
+}
+.sa-alt {
+  text-align: center;
+  color: var(--sa-mut);
+  margin: 16px 0 0;
+}
+.sa-alt a {
+  font-weight: 600;
+  color: var(--sa-text);
+}
+.sa-or {
+  display: flex;
+  align-items: center;
+  gap: 14px;
+  color: var(--sa-mut);
+  margin: 20px 0;
+}
+.sa-or::before,
+.sa-or::after {
+  content: "";
+  flex: 1;
+  height: 1px;
+  background: var(--sa-line);
+}
+.sa-soon {
+  font-size: 12px;
+  font-weight: 600;
+  background: var(--sa-hover);
+  border-radius: 99px;
+  padding: 2px 10px;
+  margin-left: 10px;
+}
+
+.sa-ck {
+  display: flex;
+  align-items: flex-start;
+  gap: 10px;
+  min-height: 44px;
+  font-size: 14px;
+  color: var(--sa-mut);
+}
+.sa-ck input {
+  width: 20px;
+  height: 20px;
+  margin-top: 2px;
+  accent-color: #0e1116;
+  flex: none;
+}
+.sa-ck a {
+  color: var(--sa-text);
+  font-weight: 600;
+}
+
+.sa-notice {
+  border-radius: 12px;
+  padding: 12px 16px;
+  font-size: 14px;
+  background: var(--sa-ok-bg);
+  color: var(--sa-text);
+}
+.sa-notice.err {
+  background: var(--sa-danger-bg);
+  color: var(--sa-danger);
+}
+
+.sa-otp {
+  display: flex;
+  gap: 6px;
+  align-items: center;
+}
+.sa-otp .sep {
+  width: 10px;
+  height: 2px;
+  background: var(--sa-line);
+  flex: none;
+  margin: 0 2px;
+}
+.sa-otp .sa-in {
+  flex: 1;
+  min-width: 0;
+  height: 56px;
+  min-height: 56px;
+  padding: 0;
+  text-align: center;
+  font: 600 24px var(--font-body, Inter, system-ui, sans-serif);
+}
+.sa-otp .sa-in.filled {
+  border-color: var(--sa-text);
+}
+.sa-ok {
+  width: 56px;
+  height: 56px;
+  border-radius: 50%;
+  background: #c6f432;
+  display: grid;
+  place-items: center;
+  margin-bottom: 20px;
+}
+
+.sa :is(a, button, input):focus-visible {
+  outline: 3px solid #c6f432;
+  outline-offset: 2px;
+}
+.sa .sa-in:focus-visible {
+  outline: none;
+}
+
+@media (max-width: 860px) {
+  .sa {
+    grid-template-columns: 1fr;
+    grid-template-rows: auto 1fr;
+  }
+  .sa-l {
+    padding: 18px 24px;
+    min-height: 0;
+  }
+  .sa-l > div,
+  .sa-l small,
+  .sa-ring {
+    display: none !important;
+  }
+  .sa-r {
+    align-items: flex-start;
+    padding: 32px 24px 40px;
+  }
+  .sa-box h1 {
+    font-size: 30px;
+  }
+}
+@media (max-width: 420px) {
+  .sa-otp {
+    gap: 4px;
+  }
+  .sa-otp .sep {
+    width: 6px;
+  }
+  .sa-otp .sa-in {
+    height: 50px;
+    min-height: 50px;
+    font-size: 20px;
+  }
+}
+@media (prefers-reduced-motion: no-preference) {
+  .sa-box {
+    animation: sa-in 0.25s ease-out;
+  }
+  @keyframes sa-in {
+    from {
+      opacity: 0;
+      transform: translateY(6px);
+    }
+    to {
+      opacity: 1;
+      transform: none;
+    }
+  }
+}

import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/signup")({ component: SignupPage });

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const parsedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    if (!parsedName) return setError("Please enter your name.");
    if (!normalizedEmail) return setError("Please enter your email.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (!acceptTerms) return setError("Please accept the Terms and Privacy Policy.");
    setLoading(true);
    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: { data: { full_name: parsedName }, emailRedirectTo: `${window.location.origin}/verify-email?email=${encodeURIComponent(normalizedEmail)}` },
      });
      if (signupError) throw signupError;
      if (!data.user) throw new Error("Unable to create your account. Please try again.");
      await supabase.auth.signOut();
      const { error: otpError } = await supabase.auth.signInWithOtp({ email: normalizedEmail, options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/verify-email?email=${encodeURIComponent(normalizedEmail)}` } });
      if (otpError) throw otpError;
      sessionStorage.setItem("strap_otp_email", normalizedEmail);
      sessionStorage.setItem("strap_otp_flow", "signup");
      navigate({ to: "/verify-email", search: { email: normalizedEmail } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <form onSubmit={handleSignup} className="w-full max-w-md rounded-3xl border bg-card p-8 shadow-lift space-y-5">
        <div className="text-center"><div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl border bg-secondary"><ShieldCheck className="size-5" /></div><h1 className="text-2xl font-semibold">Create your Strap account</h1><p className="text-sm text-muted-foreground mt-2">Your account is protected by a one-time email security code.</p></div>
        {error && <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}
        <input className="w-full rounded-2xl border bg-background px-4 py-3" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" autoComplete="name" required />
        <input className="w-full rounded-2xl border bg-background px-4 py-3" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" type="email" autoComplete="email" required />
        <div className="relative"><input className="w-full rounded-2xl border bg-background px-4 py-3 pr-12" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type={showPassword ? "text" : "password"} autoComplete="new-password" required /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
        <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="mt-1" /><span>I agree to the Terms and Privacy Policy.</span></label>
        <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-4 py-3 font-medium text-background disabled:opacity-50"><ShieldCheck size={16} />{loading ? "Securing account…" : "Create & verify account"}</button>
        <p className="text-center text-xs text-muted-foreground">After creation, Strap sends a 6-digit one-time code. The account cannot enter the workspace until verification succeeds.</p>
        <p className="text-center text-sm text-muted-foreground">Already have an account? <Link to="/login" className="underline">Sign in</Link></p>
      </form>
    </main>
  );
}
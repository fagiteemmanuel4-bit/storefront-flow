import { useEffect, useState } from "react";
import { Check, KeyRound, Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

export function PasswordOtp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"password" | "otp" | "success">("password");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) return;
      if (error || !data.user?.email) {
        toast.error("We could not determine your verified email address.");
      } else {
        setEmail(data.user.email);
      }
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setInterval(() => {
      setResendIn((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendIn]);

  const strength = getPasswordStrength(password);
  const validPassword = strength >= 4 && password.length >= 8;
  const matching = password === confirmPassword && confirmPassword.length > 0;

  async function sendOtp() {
    if (!validPassword) {
      toast.error("Use a stronger password with at least 8 characters, including upper/lowercase letters, a number and a symbol.");
      return;
    }
    if (!matching) {
      toast.error("The passwords do not match.");
      return;
    }

    setSending(true);
    const { error } = await supabase.auth.reauthenticate();
    setSending(false);

    if (error) {
      toast.error(error.message || "We could not send the verification code.");
      return;
    }

    setStep("otp");
    setResendIn(RESEND_SECONDS);
    toast.success("A 6-digit verification code was sent to your email.");
  }

  async function resendOtp() {
    if (resendIn > 0 || sending) return;
    setSending(true);
    const { error } = await supabase.auth.reauthenticate();
    setSending(false);
    if (error) {
      toast.error(error.message || "We could not resend the verification code.");
      return;
    }
    setResendIn(RESEND_SECONDS);
    toast.success("A new verification code was sent.");
  }

  async function changePassword() {
    if (otp.length !== OTP_LENGTH) {
      toast.error("Enter the 6-digit verification code from your email.");
      return;
    }
    if (!validPassword || !matching) {
      toast.error("Check your new password before continuing.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      password,
      nonce: otp,
    });
    setSaving(false);

    if (error) {
      toast.error(error.message || "The verification code was rejected. Request a new code and try again.");
      return;
    }

    setStep("success");
    setOtp("");
    toast.success("Your password has been changed successfully.");
  }

  if (loading) {
    return <div className="rounded-2xl border border-border bg-background p-8 text-sm text-muted-foreground">Loading your verified email…</div>;
  }

  if (step === "success") {
    return (
      <div className="rounded-2xl border border-border bg-background p-8 text-center shadow-sm">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
          <Check className="size-6" />
        </div>
        <h3 className="mt-5 text-xl font-bold">Password changed</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Your Strap password was updated using a verified email OTP. No sign-in link was used.
        </p>
        <Button className="mt-6" variant="outline" onClick={() => {
          setPassword("");
          setConfirmPassword("");
          setStep("password");
        }}>
          Change it again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border bg-background p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-ink">
            <KeyRound className="size-5" />
          </div>
          <div>
            <h3 className="font-semibold">Change password with email OTP</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Strap sends a 6-digit verification code to your verified email. You enter the code here; there are no magic links or redirect links in this flow.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-secondary/30 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Mail className="size-4" />
            Verification email
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{email || "Verified email unavailable"}</p>
        </div>

        {step === "password" ? (
          <div className="mt-6 space-y-5">
            <label className="block text-sm font-medium">
              New password
              <Input
                className="mt-2"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter a strong password"
              />
            </label>

            <div className="space-y-2">
              <div className="flex gap-1">
                {Array.from({ length: 5 }, (_, index) => (
                  <div key={index} className={`h-1.5 flex-1 rounded-full ${index < strength ? "bg-accent" : "bg-secondary"}`} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Use 8+ characters with uppercase, lowercase, a number and a symbol.</p>
            </div>

            <label className="block text-sm font-medium">
              Confirm new password
              <Input
                className="mt-2"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repeat your new password"
              />
            </label>

            <Button onClick={() => void sendOtp()} disabled={sending || !email}>
              <Mail className="mr-2 size-4" />
              {sending ? "Sending code…" : "Send verification code"}
            </Button>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            <div>
              <h4 className="font-semibold">Enter your verification code</h4>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Check {email} for the 6-digit code from Supabase Auth.</p>
            </div>

            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={OTP_LENGTH}
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))}
              placeholder="000000"
              className="text-center text-2xl font-semibold tracking-[0.35em]"
              aria-label="6-digit verification code"
            />

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => void changePassword()} disabled={saving || otp.length !== OTP_LENGTH}>
                {saving ? "Verifying…" : "Verify & change password"}
              </Button>
              <Button variant="ghost" onClick={() => void resendOtp()} disabled={sending || resendIn > 0}>
                <RefreshCw className="mr-2 size-4" />
                {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

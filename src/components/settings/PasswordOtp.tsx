import { useEffect, useState } from "react";
import { Check, KeyRound, Mail, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SecurityModal } from "@/components/security/SecurityModal";
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
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

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
    const timer = window.setInterval(() => setResendIn((value) => Math.max(0, value - 1)), 1000);
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

    setOtp("");
    setStep("otp");
    setVerificationOpen(true);
    setResendIn(RESEND_SECONDS);
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
    setOtp("");
    setResendIn(RESEND_SECONDS);
    toast.success("A new 6-digit verification code was sent.");
  }

  async function changePassword() {
    if (otp.length !== OTP_LENGTH || saving) return;
    if (!validPassword || !matching) {
      toast.error("Your new password is no longer valid. Close this verification and choose a new password.");
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
      setOtp("");
      return;
    }

    setOtp("");
    setVerificationOpen(false);
    setStep("success");
    setSuccessOpen(true);
    setPassword("");
    setConfirmPassword("");
  }

  function cancelVerification() {
    if (saving) return;
    setVerificationOpen(false);
    setOtp("");
    setStep("password");
    setResendIn(0);
  }

  if (loading) {
    return <div className="rounded-2xl border border-border bg-background p-8 text-sm text-muted-foreground">Loading your verified email…</div>;
  }

  return (
    <>
      <div className="space-y-4">
        <section className="rounded-2xl border border-border bg-background p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-ink">
              <KeyRound className="size-5" />
            </div>
            <div>
              <h3 className="font-semibold">Change password</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Choose a new password and verify the 6-digit code sent to your verified email. Your old password is never requested.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-border bg-secondary/30 p-4">
            <div className="flex items-center gap-2 text-sm font-medium"><Mail className="size-4" />Verification email</div>
            <p className="mt-1 text-sm text-muted-foreground">{email || "Verified email unavailable"}</p>
          </div>

          <div className="mt-6 space-y-5">
            <label className="block text-sm font-medium">
              New password
              <Input className="mt-2" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter a strong password" disabled={step === "otp"} />
            </label>

            <div className="space-y-2">
              <div className="flex gap-1">{Array.from({ length: 5 }, (_, index) => <div key={index} className={`h-1.5 flex-1 rounded-full ${index < strength ? "bg-accent" : "bg-secondary"}`} />)}</div>
              <p className="text-xs text-muted-foreground">Use 8+ characters with uppercase, lowercase, a number and a symbol.</p>
            </div>

            <label className="block text-sm font-medium">
              Confirm new password
              <Input className="mt-2" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat your new password" disabled={step === "otp"} />
            </label>

            <Button onClick={() => void sendOtp()} disabled={sending || step === "otp" || !email}>
              <Mail className="mr-2 size-4" />
              {sending ? "Sending code…" : step === "otp" ? "Verification pending…" : "Send verification code"}
            </Button>
          </div>
        </section>
      </div>

      <SecurityModal
        open={verificationOpen}
        onOpenChange={setVerificationOpen}
        dismissible={false}
        title="Verify your identity"
        description={`Enter the 6-digit code sent to ${email}. This code is required before Strap can change your password.`}
        tone="secure"
        footer={
          <>
            <Button variant="outline" onClick={cancelVerification} disabled={saving}>Cancel</Button>
            <Button onClick={() => void changePassword()} disabled={saving || otp.length !== OTP_LENGTH}>
              {saving ? "Verifying & changing…" : "Verify & change password"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-accent/20 bg-accent-soft/60 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="size-4" />Email verification required</div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Your old password is not requested. The code expires and is single-use.</p>
          </div>
          <Input
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={OTP_LENGTH}
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))}
            placeholder="000000"
            className="h-14 text-center text-2xl font-semibold tracking-[0.38em] select-none"
            aria-label="6-digit verification code"
          />
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>{resendIn > 0 ? `You can request another code in ${resendIn}s.` : "You can request a fresh code."}</span>
            <Button variant="ghost" size="sm" onClick={() => void resendOtp()} disabled={sending || resendIn > 0}>
              <RefreshCw className="mr-1.5 size-3.5" />{sending ? "Sending…" : "Resend"}
            </Button>
          </div>
        </div>
      </SecurityModal>

      <SecurityModal
        open={successOpen}
        onOpenChange={setSuccessOpen}
        title="Password changed"
        description="Your Strap password has been updated successfully. Your verification code was accepted and the old password was not required."
        tone="success"
        footer={<Button onClick={() => setSuccessOpen(false)}>Done</Button>}
      >
        <div className="rounded-2xl border border-accent/20 bg-accent-soft/60 p-4 text-sm leading-6 text-muted-foreground">
          <div className="flex items-center gap-2 font-semibold text-foreground"><Check className="size-4" />Security update complete</div>
          <p className="mt-1">For your protection, Supabase may invalidate other active sessions. You may need to sign in again on another device.</p>
        </div>
      </SecurityModal>
    </>
  );
}

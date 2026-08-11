import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
      { title: "Sign in or create your shop — Kudi" },
      {
        name: "description",
        content: "Sign in to your Kudi till, or create a free account for your shop.",
      },
      { property: "og:title", content: "Sign in or create your shop — Kudi" },
      { property: "og:description", content: "Sign in to your Kudi till or open a free account." },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Enter a valid email address").max(255);
const passwordSchema = z.string().min(8, "Use at least 8 characters").max(72);

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
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
    const parsedEmail = emailSchema.safeParse(email);
    if (!parsedEmail.success) {
      toast.error(parsedEmail.error.issues[0]!.message);
      return;
    }
    const parsedPassword = passwordSchema.safeParse(password);
    if (!parsedPassword.success) {
      toast.error(parsedPassword.error.issues[0]!.message);
      return;
    }
    if (mode === "signup" && !accepted) {
      toast.error("Please accept the Terms and Privacy Policy to continue.");
      return;
    }

    setBusy(true);
    setNotice(null);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: parsedEmail.data,
          password: parsedPassword.data,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName.trim() },
          },
        });
        if (error) throw new Error(error.message);
        if (!data.session) {
          setNotice(
            "Check your email and click the confirmation link to activate your account, then sign in.",
          );
          return;
        }
        void navigate({ to: "/onboarding", replace: true });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: parsedEmail.data,
          password: parsedPassword.data,
        });
        if (error) throw new Error(error.message);
        if (!data.session) throw new Error("Sign in did not complete. Please try again.");
        void navigate({ to: "/pos", replace: true });
      }
    } catch (error) {
      toast.error(errorMessage(error, "That didn't work. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-10 sm:px-6">
      <Link to="/" className="mx-auto flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-full bg-accent">
          <span className="size-3 rotate-45 rounded-[3px] bg-foreground" />
        </span>
        <span className="font-display text-xl font-bold tracking-tight">KUDI.</span>
      </Link>

      <div className="mx-auto mt-10 w-full max-w-md">
        <h1 className="text-display-md">
          {mode === "signin" ? "Open your till" : "Create your shop account"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {mode === "signin"
            ? "Sign in to keep selling."
            : "Free to start. You'll name your shop on the next screen."}
        </p>

        <form onSubmit={handleSubmit} className="surface-card mt-6 space-y-4 p-5 sm:p-6">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name">Your name</Label>
              <Input
                id="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-12"
                autoComplete="name"
                maxLength={120}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12"
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
            />
          </div>

          {mode === "signup" && (
            <label className="flex items-start gap-3 text-sm text-muted-foreground">
              <Checkbox
                checked={accepted}
                onCheckedChange={(value) => setAccepted(value === true)}
                className="mt-0.5"
                aria-label="Accept terms and privacy policy"
              />
              <span>
                I have read and accept the{" "}
                <Link to="/terms" className="font-semibold text-accent-ink underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="font-semibold text-accent-ink underline">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
          )}

          {notice && (
            <p className="rounded-lg bg-accent-soft p-3 text-sm text-accent-ink">{notice}</p>
          )}

          <Button type="submit" className="h-12 w-full" disabled={busy}>
            {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="font-semibold text-foreground underline"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setNotice(null);
            }}
          >
            {mode === "signin" ? "Create an account" : "Sign in instead"}
          </button>
        </p>
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthBrand } from "@/components/auth/AuthBrand";
import "@/strap-auth.css";

export const Route = createFileRoute("/verified")({ ssr: false, component: VerifiedPage });

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/auth";
  return value;
}

function VerifiedPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState("");
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const hash = window.location.hash;
  const kind =
    params.get("kind") ??
    (hash.includes("type=recovery")
      ? "password"
      : hash.includes("type=signup")
        ? "email"
        : "security");
  const next = safeNext(params.get("next"));

  const copy =
    kind === "password"
      ? {
          label: "Password verified",
          title: "You’re cleared to continue.",
          body: "Your secure verification link is valid. Continue to choose your new password.",
          action: "Continue",
        }
      : kind === "email"
        ? {
            label: "Email verified",
            title: "Your email is confirmed.",
            body: "Your account is now verified. You can return to Strap and sign in normally.",
            actiֻǱ˞
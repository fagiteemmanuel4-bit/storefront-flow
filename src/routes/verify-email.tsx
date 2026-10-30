import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AuthBrand } from "@/components/auth/AuthBrand";
import "@/strap-auth.css";

export const Route = createFileRoute("/verify-email")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Verify your email — Strap" },
      {
        name: "description",
        content: "Confirm your email with a secure one-time code to access Strap.",
      },
    ],
  }),
  component: VerifyEmailPage,
});

const RESEND_COOLDOWN_SECONDS = 60;
// Supabase is currently configured to send an 8-digit email OTP for Strap.
const OTP_LENGTH = 8;
type VerificationState = "checking" | "waiting" | "verifying" | "success" | "error";

function VerifyEmailPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/verify-email" }) as { email?: string };
  const [email, setEmail] = useState(search.email || "");
  const [state, setState] = useState<VerificationState>("waiting");
  const [message, setMessage] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [flow, setFlow] = useState<"signup" | "signin">("signin");
  const verifyingRef = useRef(false);
  const boxRefs = useRef<(HTMLInputElement | null)[]>([]);

  usֻǱ˞
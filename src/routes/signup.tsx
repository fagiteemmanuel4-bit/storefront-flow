import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/signup")({ component: SignupPage });

function SignupPage() {
  const navigate = useNavigate();

  useEffect(() => {
    void navigate({
      to: "/auth",
      search: { mode: "signup" } as never,
      replace: true,
    });
  }, [navigate]);

  return null;
}

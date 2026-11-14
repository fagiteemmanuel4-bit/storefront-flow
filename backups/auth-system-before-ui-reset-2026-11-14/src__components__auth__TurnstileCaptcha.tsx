import { useEffect, useRef } from "react";

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      theme?: "light" | "dark" | "auto";
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
    },
  ) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type TurnstileCaptchaProps = {
  onTokenChange: (token: string | null) => void;
};

const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export function TurnstileCaptcha({ onTokenChange }: TurnstileCaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onTokenChangeRef = useRef(onTokenChange);

  useEffect(() => {
    onTokenChangeRef.current = onTokenChange;
  }, []);

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;

    let widgetId: string | null = null;
    let cancelled = false;

    const renderWidget = () => {
      if (cancelled || !containerRef.current || !window.turnstile || widgetId) return;
      widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: "auto",
        callback: (token) => onTokenChangeRef.current(token),
        "expired-callback": () => onTokenChangeRef.current(null),
        "error-callback": () => onTokenChangeRef.current(null),
      });
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      let script = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
      if (!script) {
        script = document.createElement("script");
        script.src = SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", renderWidget);
      script.addEventListener("error", () => onTokenChangeRef.current(null), { once: true });
      if (window.turnstile) renderWidget();
    }

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
      onTokenChangeRef.current(null);
    };
  }, [onTokenChange]);

  if (!siteKey) {
    return (
      <p role="alert" style={{ color: "#b42318", fontSize: 13, margin: "12px 0" }}>
        Security check is not configured yet. Add VITE_TURNSTILE_SITE_KEY to the Vercel project.
      </p>
    );
  }

  return (
    <div
      ref={containerRef}
      aria-label="Security verification"
      style={{ display: "flex", justifyContent: "center", minHeight: 66, margin: "12px 0" }}
    />
  );
}

import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

type Theme = "system" | "light" | "dark";
const KEY = "strap-theme";

function readLocal(): Theme { try { const value = localStorage.getItem(KEY); return value === "light" || value === "dark" || value === "system" ? value : "system"; } catch { return "system"; } }
function apply(theme: Theme) { const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches); document.documentElement.classList.toggle("dark", dark); document.documentElement.style.colorScheme = dark ? "dark" : "light"; }

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => readLocal());
  useEffect(() => { apply(theme); try { localStorage.setItem(KEY, theme); } catch {} }, [theme]);
  useEffect(() => { const media = window.matchMedia("(prefers-color-scheme: dark)"); const onChange = () => { if (theme === "system") apply("system"); }; media.addEventListener("change", onChange); return () => media.removeEventListener("change", onChange); }, [theme]);
  useEffect(() => {
    let cancelled = false;
    const loadPreference = async (userId: string) => {
      const { data: profile } = await supabase.from("profiles").select("theme_preference").eq("id", userId).maybeSingle();
      const value = profile?.theme_preference as Theme | undefined;
      if (!cancelled && (value === "light" || value === "dark" || value === "system")) setTheme(value);
    };
    void supabase.auth.getUser().then(({ data }) => { if (data.user) void loadPreference(data.user.id); });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") setTheme("system");
      if (event === "SIGNED_IN" && session?.user) queueMicrotask(() => { void loadPreference(session.user.id); });
    });
    return () => { cancelled = true; data.subscription.unsubscribe(); };
  }, []);
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

import { createContext, useContext } from "react";
const ThemeContext = createContext<{ theme: Theme; setTheme: (theme: Theme) => void } | null>(null);
export function useTheme() { const context = useContext(ThemeContext); if (!context) throw new Error("useTheme must be used inside ThemeProvider"); return context; }

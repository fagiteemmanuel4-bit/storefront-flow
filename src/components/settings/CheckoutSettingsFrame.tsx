import { ReactNode } from "react";

export function CheckoutSettingsFrame({ children }: { children: ReactNode }) {
  return <div className="rounded-[1.75rem] border border-border bg-surface p-4 shadow-sm sm:p-6 lg:p-8 [&_section]:rounded-2xl [&_section]:border-border [&_section]:bg-background [&_section]:shadow-none [&_input]:h-11 [&_select]:h-11 [&_textarea]:min-h-28">
    {children}
  </div>;
}

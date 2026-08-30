import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-10 w-full min-w-0 rounded-[var(--radius-sm)] border border-border-strong bg-surface px-3 py-2 text-base text-foreground shadow-none transition-[border-color,box-shadow,background-color] duration-[var(--motion-fast)] placeholder:text-muted-foreground focus-visible:border-[var(--brand-600)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--brand-600)_18%,transparent)] disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:opacity-60 md:text-sm",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";
export { Input };

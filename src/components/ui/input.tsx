import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full min-w-0 rounded-xl border border-input bg-surface px-3.5 py-2 text-base transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#c6f432]/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";
export { Input };

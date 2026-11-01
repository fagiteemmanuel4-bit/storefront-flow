import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold cursor-pointer transition-[background-color,border-color,color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#c6f432]/60 disabled:pointer-events-none disabled:opacity-45 disabled:cursor-not-allowed active:scale-[.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-foreground text-background hover:bg-foreground/90 dark:bg-[#c6f432] dark:text-[#0e1116] dark:hover:bg-[#d3f85a]",
        accent: "bg-[#c6f432] text-[#0e1116] hover:bg-[#d3f85a]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-surface text-foreground hover:border-foreground/40 hover:bg-secondary",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/70",
        ghost: "text-foreground/80 hover:bg-secondary hover:text-foreground",
        link: "text-foreground underline-offset-4 hover:text-accent-ink hover:underline",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-10 px-4 text-[13px]",
        lg: "h-12 px-6 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";
export { Button, buttonVariants };

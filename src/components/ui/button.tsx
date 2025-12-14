import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md",
        destructive: "bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0",
        outline: "border-2 border-border bg-transparent hover:bg-secondary hover:border-primary/30 hover:text-foreground hover:shadow-sm active:bg-secondary/80",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-sm active:bg-secondary/70",
        ghost: "hover:bg-secondary hover:text-foreground active:bg-secondary/80",
        link: "text-primary underline-offset-4 hover:underline active:text-primary/80",
        hero: "bg-gradient-primary text-white shadow-lg hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0",
        trust: "bg-gradient-trust text-white shadow-lg hover:shadow-trust hover:scale-[1.02] active:scale-[0.98] hover:-translate-y-0.5 active:translate-y-0",
        glass: "glass text-foreground hover:shadow-md border-transparent hover:border-primary/20 hover:-translate-y-0.5 active:translate-y-0",
        premium: "bg-foreground text-background shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] hover:-translate-y-0.5",
        warm: "bg-gradient-warm text-white shadow-lg hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] hover:-translate-y-0.5",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-13 rounded-xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-base font-bold tracking-wide",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glacier",
  {
    variants: {
      variant: {
        primary: "bg-ink text-snow hover:bg-ink/90",
        accent: "bg-brand text-white hover:bg-brand-dark",
        outline: "border border-line bg-surface hover:bg-snow",
        ghost: "hover:bg-line/60",
      },
      size: {
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-6",
        sm: "h-9 px-3 text-sm",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };

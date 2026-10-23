import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-line bg-white px-4 text-sm outline-none transition focus:border-glacier focus:ring-2 focus:ring-glacier/20",
        className,
      )}
      {...props}
    />
  );
}

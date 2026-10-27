import * as React from "react";
import { cn } from "@/lib/utils";

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-xl border border-line bg-surface px-4 text-sm outline-none transition focus:border-glacier focus:ring-2 focus:ring-glacier/20",
        className,
      )}
      {...props}
    />
  );
}

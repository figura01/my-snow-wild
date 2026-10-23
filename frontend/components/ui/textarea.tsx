import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-glacier focus:ring-2 focus:ring-glacier/20",
        className,
      )}
      {...props}
    />
  );
}

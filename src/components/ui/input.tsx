import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-xl border border-border/90 bg-white px-3 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/25",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

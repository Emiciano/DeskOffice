import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type CardProps = PropsWithChildren<{ className?: string }>;

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn("rounded-2xl border border-border/80 bg-white/95 p-4 shadow-soft backdrop-blur-sm lg:p-5", className)}>
      {children}
    </div>
  );
}

import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type CardProps = PropsWithChildren<{ className?: string }>;

export function Card({ children, className }: CardProps) {
  return <div className={cn("rounded-2xl border border-border bg-white p-5 shadow-soft", className)}>{children}</div>;
}

import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px]" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-[60] w-[min(1320px,96vw)] max-w-[96vw] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-white p-4 shadow-soft",
          className,
        )}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

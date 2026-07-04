"use client";

/**
 * Responsive Modal — renders as:
 *   - Dialog (centered overlay)  on md: and above
 *   - Drawer (bottom sheet)       below md: (mobile)
 *
 * API is identical to the legacy Modal component so all call sites work unchanged.
 */

import * as React from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Modal({ open, onClose, title, children, className }: ModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent
          className={cn(
            "max-w-md bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6",
            className,
          )}
        >
          {title && (
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-foreground">
                {title}
              </DialogTitle>
            </DialogHeader>
          )}
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  // Mobile: bottom sheet drawer
  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent
        className={cn(
          "bg-[#1A1A1A] border-t border-[#2A2A2A] rounded-t-3xl max-h-[90dvh]",
          className,
        )}
      >
        {/* Drag handle */}
        <div className="mx-auto mt-3 mb-1 h-1 w-10 rounded-full bg-[#333]" />

        {title && (
          <DrawerHeader className="pt-2 pb-0 px-6">
            <DrawerTitle className="text-lg font-semibold text-foreground text-left">
              {title}
            </DrawerTitle>
          </DrawerHeader>
        )}

        {/* Scrollable content */}
        <div className="overflow-y-auto px-6 pb-6 pt-3">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}

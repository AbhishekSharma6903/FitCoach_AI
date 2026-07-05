"use client";

/**
 * Responsive Modal — renders as:
 *   - Dialog (centered overlay)  on lg: and above (≥ 1024px)
 *   - Drawer (bottom sheet)       below lg: (mobile + tablet)
 *
 * Breakpoint matches TopNav/BottomNav (lg:) so modal style is consistent
 * with which navigation mode is active. Previously used md: (768px) which
 * caused iPad portrait to get desktop Dialog while on mobile BottomNav.
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
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent
          className={cn(
            // max-w-2xl gives 672px — proportional on 1280px desktop without feeling tiny
            // min-h ensures the modal has visual presence before content fills it
            "max-w-2xl min-h-130 bg-[#111111] border border-[#2A2A2A] rounded-2xl p-0 flex flex-col overflow-hidden",
            className,
          )}
        >
          {title && (
            <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
              <DialogTitle className="text-xl font-bold text-foreground">
                {title}
              </DialogTitle>
            </DialogHeader>
          )}
          {/* Content scrolls within the fixed-height modal */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4 min-h-0">
            {children}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Mobile: bottom sheet drawer — snapPoints forces it open to 85% height
  // Without snapPoints, Base UI Drawer auto-sizes to content (just title + input = tiny)
  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()} snapPoints={[0.85]}>
      <DrawerContent
        className={cn(
          "bg-[#111111] border-t border-[#2A2A2A] rounded-t-3xl",
          className,
        )}
      >
        {/* Drag handle */}
        <div className="mx-auto mt-3 mb-0 h-1 w-10 rounded-full bg-[#2A2A2A] shrink-0" />

        {title && (
          <DrawerHeader className="pt-3 pb-0 px-6 shrink-0">
            <DrawerTitle className="text-lg font-semibold text-foreground text-left">
              {title}
            </DrawerTitle>
          </DrawerHeader>
        )}

        {/* Scrollable content fills remaining height */}
        <div className="flex-1 overflow-y-auto px-6 pb-8 pt-4 min-h-0">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}

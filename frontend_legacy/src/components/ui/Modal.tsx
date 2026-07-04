"use client";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        "relative z-10 w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-card p-6 mx-4",
        className
      )}>
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="text-lg font-semibold text-gray-100">{title}</h2>}
          <button onClick={onClose} className="ml-auto text-gray-500 hover:text-gray-300 transition-colors">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

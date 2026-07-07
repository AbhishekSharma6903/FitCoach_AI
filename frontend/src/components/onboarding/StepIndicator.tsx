"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

export default function StepIndicator({
  currentStep,
  totalSteps,
  labels,
}: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center mb-8">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div key={i} className="flex items-center">
          {/* Circle */}
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200",
                i < currentStep
                  ? "bg-primary text-black"
                  : i === currentStep
                  ? "bg-primary text-black ring-4 ring-primary/20"
                  : "bg-[#1A1A1A] border border-[#2A2A2A] text-muted-foreground",
              )}
            >
              {i < currentStep ? (
                <Check size={14} strokeWidth={2.5} />
              ) : (
                <span className="text-xs font-bold">{i + 1}</span>
              )}
            </div>
            {/* Label — always show, smaller on SE */}
            {labels?.[i] && (
              <span
                className={cn(
                  "block text-[9px] sm:text-[10px] font-medium text-center leading-tight",
                  i === currentStep
                    ? "text-primary"
                    : i < currentStep
                    ? "text-primary/60"
                    : "text-muted-foreground/40",
                )}
              >
                {labels[i]}
              </span>
            )}
          </div>

          {/* Connector line (not after last) */}
          {i < totalSteps - 1 && (
            <div
              className={cn(
                "h-0.5 w-10 sm:w-16 mx-1 mb-4.5 transition-all duration-300",
                i < currentStep ? "bg-primary" : "bg-[#2A2A2A]",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

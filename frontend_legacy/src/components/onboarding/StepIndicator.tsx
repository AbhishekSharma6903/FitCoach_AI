"use client";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

export default function StepIndicator({ currentStep, totalSteps, labels }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
            i < currentStep ? "bg-brand-500 text-white" :
            i === currentStep ? "bg-brand-500 text-white ring-4 ring-brand-500/20" :
            "bg-gray-800 text-gray-500 border border-gray-700"
          )}>
            {i < currentStep ? "✓" : i + 1}
          </div>
          {labels?.[i] && (
            <span className={cn("text-xs hidden sm:block", i === currentStep ? "text-brand-400 font-medium" : "text-gray-600")}>
              {labels[i]}
            </span>
          )}
          {i < totalSteps - 1 && (
            <div className={cn("w-8 h-0.5 transition-all", i < currentStep ? "bg-brand-500" : "bg-gray-800")} />
          )}
        </div>
      ))}
    </div>
  );
}

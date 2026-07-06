"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OnboardingFormData } from "@/types/profile";

interface StepProps {
  data: OnboardingFormData;
  onChange: (updates: Partial<OnboardingFormData>) => void;
  errors: Partial<Record<keyof OnboardingFormData, string>>;
}

const DIET_TYPES = [
  { value: "veg",     label: "Vegetarian", icon: "🥦", sub: "No meat or eggs" },
  { value: "egg",     label: "Eggetarian", icon: "🥚", sub: "Veg + eggs"      },
  { value: "non_veg", label: "Non-Veg",    icon: "🍗", sub: "All foods"       },
] as const;

const PLAN_TOGGLES = [
  {
    key:   "wants_workout_split" as const,
    label: "Generate a personalised workout split",
    sub:   "Based on your goal and experience",
  },
  {
    key:   "wants_diet_plan" as const,
    label: "Generate a personalised diet plan",
    sub:   "Meal suggestions matching your macros",
  },
];

export default function Step4Diet({ data, onChange, errors }: StepProps) {
  return (
    <div className="space-y-5 pt-2">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Diet preferences</h2>
        <p className="text-sm text-muted-foreground mt-1">
          We'll build your meal plan around these choices.
        </p>
      </div>

      {/* Diet type cards */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Diet type <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {DIET_TYPES.map(d => (
            <button
              key={d.value}
              type="button"
              onClick={() => onChange({ diet_type: d.value })}
              className={cn(
                "flex flex-col items-center py-4 rounded-xl border transition-all",
                data.diet_type === d.value
                  ? "border-primary bg-primary/10"
                  : "border-[#2A2A2A] hover:border-[#3A3A3A]",
              )}
            >
              <span className="text-2xl mb-1" aria-hidden="true">{d.icon}</span>
              <span className={cn(
                "text-sm font-semibold",
                data.diet_type === d.value ? "text-primary" : "text-foreground",
              )}>
                {d.label}
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5">{d.sub}</span>
            </button>
          ))}
        </div>
        {errors.diet_type && (
          <p className="text-xs text-red-400 mt-1">{errors.diet_type}</p>
        )}
      </div>

      {/* Optional plan toggles */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          Additional plans <span className="text-muted-foreground/40">(optional)</span>
        </p>
        {PLAN_TOGGLES.map(({ key, label, sub }) => {
          const active = !!data[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange({ [key]: !active })}
              className={cn(
                "w-full flex items-start gap-3 px-4 py-3.5 rounded-xl border text-left transition-all",
                active
                  ? "border-primary bg-primary/10"
                  : "border-[#2A2A2A] hover:border-[#3A3A3A]",
              )}
            >
              {/* Checkbox indicator */}
              <div className={cn(
                "mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 transition-all",
                active ? "bg-primary" : "bg-[#2A2A2A]",
              )}>
                {active && <Check size={12} className="text-black" strokeWidth={2.5} />}
              </div>
              <div>
                <p className={cn(
                  "text-sm font-medium",
                  active ? "text-foreground" : "text-muted-foreground",
                )}>
                  {label}
                </p>
                <p className="text-xs text-muted-foreground/50 mt-0.5">{sub}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

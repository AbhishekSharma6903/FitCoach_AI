"use client";
import type { OnboardingFormData } from "@/types/profile";
import { cn } from "@/lib/utils";

interface Props {
  data: OnboardingFormData;
  onChange: (updates: Partial<OnboardingFormData>) => void;
  errors: Partial<Record<keyof OnboardingFormData, string>>;
}

const dietTypes = [
  { value: "veg", label: "Vegetarian", icon: "🥦", sub: "No meat or eggs" },
  { value: "egg", label: "Eggetarian", icon: "🥚", sub: "Veg + eggs" },
  { value: "non_veg", label: "Non-Veg", icon: "🍗", sub: "All foods" },
];

export default function Step4Diet({ data, onChange, errors }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-100">Diet preferences</h2>
        <p className="text-gray-500 mt-1 text-sm">We&apos;ll build your meal plan around these choices.</p>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-300 mb-2">Diet Type <span className="text-red-400">*</span></p>
        <div className="grid grid-cols-3 gap-3">
          {dietTypes.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => onChange({ diet_type: d.value as OnboardingFormData["diet_type"] })}
              className={cn(
                "flex flex-col items-center py-4 rounded-xl border transition-all",
                data.diet_type === d.value
                  ? "border-brand-500 bg-brand-500/10"
                  : "border-gray-700 hover:border-gray-600"
              )}
            >
              <span className="text-2xl mb-1">{d.icon}</span>
              <span className={cn("text-sm font-semibold", data.diet_type === d.value ? "text-brand-400" : "text-gray-300")}>{d.label}</span>
              <span className="text-xs text-gray-500 mt-0.5">{d.sub}</span>
            </button>
          ))}
        </div>
        {errors.diet_type && <p className="text-xs text-red-400 mt-1">{errors.diet_type}</p>}
      </div>

      <div className="space-y-3 pt-2">
        <p className="text-sm font-medium text-gray-300">Additional Plans</p>

        {[
          { key: "wants_workout_split", label: "Generate a personalised workout split", sub: "Based on your goal and experience" },
          { key: "wants_diet_plan", label: "Generate a personalised diet plan", sub: "Meal suggestions matching your macros" },
        ].map(({ key, label, sub }) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange({ [key]: !data[key as keyof OnboardingFormData] } as Partial<OnboardingFormData>)}
            className={cn(
              "w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all",
              data[key as keyof OnboardingFormData]
                ? "border-brand-500 bg-brand-500/10"
                : "border-gray-700 hover:border-gray-600"
            )}
          >
            <div className={cn(
              "mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all",
              data[key as keyof OnboardingFormData] ? "bg-brand-500 text-white" : "bg-gray-700"
            )}>
              {data[key as keyof OnboardingFormData] && <span className="text-xs">✓</span>}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-200">{label}</p>
              <p className="text-xs text-gray-500">{sub}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

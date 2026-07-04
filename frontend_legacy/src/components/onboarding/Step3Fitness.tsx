"use client";
import Select from "@/components/ui/Select";
import FormField from "@/components/ui/FormField";
import type { OnboardingFormData } from "@/types/profile";
import { cn } from "@/lib/utils";

interface Props {
  data: OnboardingFormData;
  onChange: (updates: Partial<OnboardingFormData>) => void;
  errors: Partial<Record<keyof OnboardingFormData, string>>;
}

const levels = [
  { value: "beginner", label: "Beginner", sub: "0–1 year" },
  { value: "intermediate", label: "Intermediate", sub: "2–4 years" },
  { value: "pro", label: "Pro", sub: "4+ years" },
];

const activityOptions = [
  { value: "sedentary", label: "Sedentary — desk job, no exercise" },
  { value: "light", label: "Light — 1–3 days/week" },
  { value: "moderate", label: "Moderate — 3–5 days/week" },
  { value: "intense", label: "Intense — 6–7 days/week" },
  { value: "very_intense", label: "Very Intense — physical job + daily training" },
];

export default function Step3Fitness({ data, onChange, errors }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-100">Your fitness level</h2>
        <p className="text-gray-500 mt-1 text-sm">This helps us tailor the right workout split for you.</p>
      </div>

      <FormField label="Experience Level" error={errors.experience_level} required>
        <div className="grid grid-cols-3 gap-3">
          {levels.map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => onChange({ experience_level: l.value as OnboardingFormData["experience_level"] })}
              className={cn(
                "flex flex-col items-center py-3 rounded-xl border text-sm transition-all",
                data.experience_level === l.value
                  ? "border-brand-500 bg-brand-500/10"
                  : "border-gray-700 hover:border-gray-600"
              )}
            >
              <span className={cn("font-semibold", data.experience_level === l.value ? "text-brand-400" : "text-gray-300")}>
                {l.label}
              </span>
              <span className="text-xs text-gray-500 mt-0.5">{l.sub}</span>
            </button>
          ))}
        </div>
        {errors.experience_level && <p className="text-xs text-red-400 mt-1">{errors.experience_level}</p>}
      </FormField>

      <FormField label="Activity Level" error={errors.activity_level} required>
        <Select
          options={activityOptions}
          placeholder="Select activity level"
          value={data.activity_level}
          onChange={(e) => onChange({ activity_level: e.target.value as OnboardingFormData["activity_level"] })}
          error={errors.activity_level}
        />
      </FormField>
    </div>
  );
}

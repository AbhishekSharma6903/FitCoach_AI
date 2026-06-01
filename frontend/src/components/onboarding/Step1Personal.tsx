"use client";
import Input from "@/components/ui/Input";
import FormField from "@/components/ui/FormField";
import type { OnboardingFormData } from "@/types/profile";
import { cn } from "@/lib/utils";

interface Props {
  data: OnboardingFormData;
  onChange: (updates: Partial<OnboardingFormData>) => void;
  errors: Partial<Record<keyof OnboardingFormData, string>>;
}

const genders = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

export default function Step1Personal({ data, onChange, errors }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-100">Tell us about yourself</h2>
        <p className="text-gray-500 mt-1 text-sm">We&apos;ll use this to personalise your fitness plan.</p>
      </div>

      <FormField label="Your Name" error={errors.name} required>
        <Input
          placeholder="e.g. Arjun Sharma"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
          error={errors.name}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Age" error={errors.age} required>
          <Input
            type="number"
            placeholder="e.g. 28"
            min={10} max={120}
            value={data.age === "" ? "" : data.age}
            onChange={(e) => onChange({ age: e.target.value === "" ? "" : Number(e.target.value) })}
            error={errors.age}
          />
        </FormField>

        <FormField label="Height (cm)" error={errors.height_cm} required>
          <Input
            type="number"
            placeholder="e.g. 175"
            min={100} max={250}
            value={data.height_cm === "" ? "" : data.height_cm}
            onChange={(e) => onChange({ height_cm: e.target.value === "" ? "" : Number(e.target.value) })}
            error={errors.height_cm}
          />
        </FormField>
      </div>

      <FormField label="Gender" error={errors.gender} required>
        <div className="flex gap-3">
          {genders.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => onChange({ gender: g.value as OnboardingFormData["gender"] })}
              className={cn(
                "flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all",
                data.gender === g.value
                  ? "border-brand-500 bg-brand-500/10 text-brand-400"
                  : "border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300"
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
        {errors.gender && <p className="text-xs text-red-400 mt-1">{errors.gender}</p>}
      </FormField>
    </div>
  );
}

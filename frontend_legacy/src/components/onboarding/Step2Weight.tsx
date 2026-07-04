"use client";
import Input from "@/components/ui/Input";
import FormField from "@/components/ui/FormField";
import type { OnboardingFormData } from "@/types/profile";

interface Props {
  data: OnboardingFormData;
  onChange: (updates: Partial<OnboardingFormData>) => void;
  errors: Partial<Record<keyof OnboardingFormData, string>>;
}

export default function Step2Weight({ data, onChange, errors }: Props) {
  const weightDelta =
    data.current_weight_kg !== "" && data.goal_weight_kg !== ""
      ? Number(data.goal_weight_kg) - Number(data.current_weight_kg)
      : null;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-100">Your weight goals</h2>
        <p className="text-gray-500 mt-1 text-sm">We use this to calculate your daily calorie target.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Current Weight (kg)" error={errors.current_weight_kg} required>
          <Input
            type="number" placeholder="e.g. 82" min={30} max={300} step={0.1}
            value={data.current_weight_kg === "" ? "" : data.current_weight_kg}
            onChange={(e) => onChange({ current_weight_kg: e.target.value === "" ? "" : Number(e.target.value) })}
            error={errors.current_weight_kg}
          />
        </FormField>

        <FormField label="Goal Weight (kg)" error={errors.goal_weight_kg} required>
          <Input
            type="number" placeholder="e.g. 72" min={30} max={300} step={0.1}
            value={data.goal_weight_kg === "" ? "" : data.goal_weight_kg}
            onChange={(e) => onChange({ goal_weight_kg: e.target.value === "" ? "" : Number(e.target.value) })}
            error={errors.goal_weight_kg}
          />
        </FormField>
      </div>

      {weightDelta !== null && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium border ${
          weightDelta < 0
            ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
            : weightDelta > 0
            ? "bg-orange-500/10 border-orange-500/30 text-orange-400"
            : "bg-brand-500/10 border-brand-500/30 text-brand-400"
        }`}>
          Goal: {weightDelta < 0 ? `Lose ${Math.abs(weightDelta).toFixed(1)} kg` : weightDelta > 0 ? `Gain ${weightDelta.toFixed(1)} kg` : "Maintain weight"}
        </div>
      )}

      <FormField label="Time to reach goal (weeks)" error={errors.time_to_reach_goal_weeks} required>
        <Input
          type="number" placeholder="e.g. 20" min={4} max={104}
          value={data.time_to_reach_goal_weeks === "" ? "" : data.time_to_reach_goal_weeks}
          onChange={(e) => onChange({ time_to_reach_goal_weeks: e.target.value === "" ? "" : Number(e.target.value) })}
          error={errors.time_to_reach_goal_weeks}
        />
        <p className="text-xs text-gray-600 mt-1">Minimum 4 weeks for safe, sustainable progress.</p>
      </FormField>
    </div>
  );
}

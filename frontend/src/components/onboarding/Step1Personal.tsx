"use client";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { OnboardingFormData } from "@/types/profile";

interface StepProps {
  data: OnboardingFormData;
  onChange: (updates: Partial<OnboardingFormData>) => void;
  errors: Partial<Record<keyof OnboardingFormData, string>>;
}

const GENDERS = [
  { value: "male",   label: "Male"   },
  { value: "female", label: "Female" },
  { value: "other",  label: "Other"  },
] as const;

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-xs font-medium text-muted-foreground">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-400 mt-1">{msg}</p>;
}

export default function Step1Personal({ data, onChange, errors }: StepProps) {
  return (
    <div className="space-y-5 pt-2">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Tell us about yourself</h2>
        <p className="text-sm text-muted-foreground mt-1">
          We'll use this to personalise your fitness plan.
        </p>
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <FieldLabel required>Your name</FieldLabel>
        <Input
          type="text"
          placeholder="e.g. Arjun Sharma"
          autoComplete="name"
          value={data.name}
          onChange={e => onChange({ name: e.target.value })}
          className={cn(
            "h-11 bg-[#222222] border-[#2A2A2A] focus:border-primary text-sm",
            errors.name && "border-red-500/50",
          )}
        />
        <FieldError msg={errors.name} />
      </div>

      {/* Age + Height — side-by-side on sm+, stacked on SE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <FieldLabel required>Age</FieldLabel>
          <Input
            type="number"
            placeholder="e.g. 28"
            min={10} max={120}
            value={data.age === "" ? "" : data.age}
            onChange={e => onChange({ age: e.target.value === "" ? "" : Number(e.target.value) })}
            className={cn(
              "h-11 bg-[#222222] border-[#2A2A2A] focus:border-primary text-sm",
              errors.age && "border-red-500/50",
            )}
          />
          <FieldError msg={errors.age} />
        </div>
        <div className="space-y-1.5">
          <FieldLabel required>Height (cm)</FieldLabel>
          <Input
            type="number"
            placeholder="e.g. 175"
            min={100} max={250}
            value={data.height_cm === "" ? "" : data.height_cm}
            onChange={e => onChange({ height_cm: e.target.value === "" ? "" : Number(e.target.value) })}
            className={cn(
              "h-11 bg-[#222222] border-[#2A2A2A] focus:border-primary text-sm",
              errors.height_cm && "border-red-500/50",
            )}
          />
          <FieldError msg={errors.height_cm} />
        </div>
      </div>

      {/* Gender pills */}
      <div className="space-y-1.5">
        <FieldLabel required>Gender</FieldLabel>
        <div className="grid grid-cols-3 gap-2">
          {GENDERS.map(g => (
            <button
              key={g.value}
              type="button"
              onClick={() => onChange({ gender: g.value })}
              className={cn(
                "h-11 rounded-xl border text-sm font-semibold transition-all",
                data.gender === g.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-[#2A2A2A] text-muted-foreground hover:border-[#3A3A3A] hover:text-foreground",
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
        <FieldError msg={errors.gender} />
      </div>
    </div>
  );
}

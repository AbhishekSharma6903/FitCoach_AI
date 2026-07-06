"use client";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { OnboardingFormData } from "@/types/profile";

interface StepProps {
  data: OnboardingFormData;
  onChange: (updates: Partial<OnboardingFormData>) => void;
  errors: Partial<Record<keyof OnboardingFormData, string>>;
}

const EXPERIENCE_LEVELS = [
  { value: "beginner",     label: "Beginner",      sub: "0–1 year"  },
  { value: "intermediate", label: "Intermediate",  sub: "2–4 years" },
  { value: "pro",          label: "Pro",           sub: "4+ years"  },
] as const;

const ACTIVITY_OPTIONS = [
  { value: "sedentary",    label: "Sedentary — desk job, no exercise"          },
  { value: "light",        label: "Light — 1–3 days/week"                      },
  { value: "moderate",     label: "Moderate — 3–5 days/week"                   },
  { value: "intense",      label: "Intense — 6–7 days/week"                    },
  { value: "very_intense", label: "Very Intense — physical job + daily training" },
] as const;

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-400 mt-1">{msg}</p>;
}

export default function Step3Fitness({ data, onChange, errors }: StepProps) {
  const activityLabel =
    ACTIVITY_OPTIONS.find(o => o.value === data.activity_level)?.label ?? "Select activity level";

  return (
    <div className="space-y-5 pt-2">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Your fitness level</h2>
        <p className="text-sm text-muted-foreground mt-1">
          This helps us tailor the right workout approach for you.
        </p>
      </div>

      {/* Experience cards */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Experience level <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {EXPERIENCE_LEVELS.map(l => (
            <button
              key={l.value}
              type="button"
              onClick={() => onChange({ experience_level: l.value })}
              className={cn(
                "flex flex-col items-center py-4 rounded-xl border transition-all",
                data.experience_level === l.value
                  ? "border-primary bg-primary/10"
                  : "border-[#2A2A2A] hover:border-[#3A3A3A]",
              )}
            >
              <span className={cn(
                "text-sm font-semibold",
                data.experience_level === l.value ? "text-primary" : "text-foreground",
              )}>
                {l.label}
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5">{l.sub}</span>
            </button>
          ))}
        </div>
        <FieldError msg={errors.experience_level} />
      </div>

      {/* Activity level — Select (5 options, too many for cards) */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Activity level <span className="text-red-400">*</span>
        </label>
        <Select
          value={data.activity_level}
          onValueChange={(v: string | null) =>
            v && onChange({ activity_level: v as OnboardingFormData["activity_level"] })
          }
        >
          <SelectTrigger
            className={cn(
              "h-11 w-full bg-[#222222] border-[#2A2A2A] focus:border-primary",
              "hover:bg-[#2A2A2A] rounded-xl text-sm",
              errors.activity_level && "border-red-500/50",
            )}
          >
            <span className={cn(
              "flex-1 text-left",
              data.activity_level ? "text-foreground" : "text-muted-foreground",
            )}>
              {activityLabel}
            </span>
          </SelectTrigger>
          <SelectContent>
            {ACTIVITY_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError msg={errors.activity_level} />
      </div>
    </div>
  );
}

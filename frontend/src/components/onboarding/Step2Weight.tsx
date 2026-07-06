"use client";

import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { OnboardingFormData } from "@/types/profile";

interface StepProps {
  data: OnboardingFormData;
  onChange: (updates: Partial<OnboardingFormData>) => void;
  errors: Partial<Record<keyof OnboardingFormData, string>>;
}

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

export default function Step2Weight({ data, onChange, errors }: StepProps) {
  const current = Number(data.current_weight_kg);
  const goal    = Number(data.goal_weight_kg);
  const hasWeights = data.current_weight_kg !== "" && data.goal_weight_kg !== "";
  const delta = hasWeights ? goal - current : null;

  const weeks = Number(data.time_to_reach_goal_weeks);
  const showPace = delta !== null && weeks >= 4 && delta !== 0;
  const pace = showPace ? (Math.abs(delta) / weeks).toFixed(2) : null;

  return (
    <div className="space-y-5 pt-2">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Your weight goals</h2>
        <p className="text-sm text-muted-foreground mt-1">
          We use this to calculate your daily calorie target.
        </p>
      </div>

      {/* Current + Goal weight */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <FieldLabel required>Current weight (kg)</FieldLabel>
          <Input
            type="number" placeholder="e.g. 82" min={30} max={300} step={0.1}
            value={data.current_weight_kg === "" ? "" : data.current_weight_kg}
            onChange={e => onChange({ current_weight_kg: e.target.value === "" ? "" : Number(e.target.value) })}
            className={cn(
              "h-11 bg-[#222222] border-[#2A2A2A] focus:border-primary text-sm",
              errors.current_weight_kg && "border-red-500/50",
            )}
          />
          <FieldError msg={errors.current_weight_kg} />
        </div>
        <div className="space-y-1.5">
          <FieldLabel required>Goal weight (kg)</FieldLabel>
          <Input
            type="number" placeholder="e.g. 72" min={30} max={300} step={0.1}
            value={data.goal_weight_kg === "" ? "" : data.goal_weight_kg}
            onChange={e => onChange({ goal_weight_kg: e.target.value === "" ? "" : Number(e.target.value) })}
            className={cn(
              "h-11 bg-[#222222] border-[#2A2A2A] focus:border-primary text-sm",
              errors.goal_weight_kg && "border-red-500/50",
            )}
          />
          <FieldError msg={errors.goal_weight_kg} />
        </div>
      </div>

      {/* Goal delta banner */}
      <AnimatePresence>
        {delta !== null && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "rounded-xl border px-4 py-3 text-sm font-semibold",
              delta < 0
                ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                : delta > 0
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "bg-primary/10 border-primary/30 text-primary",
            )}
          >
            Goal:{" "}
            {delta < 0
              ? `Lose ${Math.abs(delta).toFixed(1)} kg`
              : delta > 0
              ? `Gain ${delta.toFixed(1)} kg`
              : "Maintain weight"}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline */}
      <div className="space-y-1.5">
        <FieldLabel required>Timeline (weeks)</FieldLabel>
        <Input
          type="number" placeholder="e.g. 20" min={4} max={104}
          value={data.time_to_reach_goal_weeks === "" ? "" : data.time_to_reach_goal_weeks}
          onChange={e => onChange({ time_to_reach_goal_weeks: e.target.value === "" ? "" : Number(e.target.value) })}
          className={cn(
            "h-11 bg-[#222222] border-[#2A2A2A] focus:border-primary text-sm",
            errors.time_to_reach_goal_weeks && "border-red-500/50",
          )}
        />
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground/50">
            Minimum 4 weeks for safe, sustainable progress
          </p>
          {pace && (
            <p className="text-[10px] text-muted-foreground/60">
              ≈ {pace} kg/week required
            </p>
          )}
        </div>
        <FieldError msg={errors.time_to_reach_goal_weeks} />
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from "@/components/ui/select";
import Spinner from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import {
  ACTIVITY_OPTIONS, DIET_OPTIONS,
  previewTargetCalories,
} from "@/lib/profileUtils";
import api from "@/lib/api";
import type { UserProfile } from "@/types/profile";

interface UpdateGoalsFormProps {
  profile: UserProfile;
  onSaved: () => void;
}

interface FormState {
  current_weight_kg: string;
  goal_weight_kg: string;
  time_to_reach_goal_weeks: string;
  activity_level: string;
  diet_type: string;
}

function toForm(p: UserProfile): FormState {
  return {
    current_weight_kg:        String(p.current_weight_kg),
    goal_weight_kg:           String(p.goal_weight_kg),
    time_to_reach_goal_weeks: String(p.time_to_reach_goal_weeks),
    activity_level:           p.activity_level,
    diet_type:                p.diet_type,
  };
}

export default function UpdateGoalsForm({ profile, onSaved }: UpdateGoalsFormProps) {
  const [form, setForm]     = useState<FormState>(() => toForm(profile));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  // Re-sync if profile changes externally (e.g. another tab saved)
  useEffect(() => { setForm(toForm(profile)); }, [profile]);

  function set(key: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  const isDirty = useMemo(() => (
    Number(form.current_weight_kg)        !== Number(profile.current_weight_kg) ||
    Number(form.goal_weight_kg)           !== Number(profile.goal_weight_kg)    ||
    Number(form.time_to_reach_goal_weeks) !== Number(profile.time_to_reach_goal_weeks) ||
    form.activity_level !== profile.activity_level ||
    form.diet_type      !== profile.diet_type
  ), [form, profile]);

  // Live preview — mirrors backend formula
  const previewValid =
    Number(form.current_weight_kg) > 0 &&
    Number(form.goal_weight_kg) > 0 &&
    Number(form.time_to_reach_goal_weeks) >= 4 &&
    form.activity_level !== "";

  const preview = previewValid
    ? previewTargetCalories(
        Number(form.current_weight_kg),
        Number(form.goal_weight_kg),
        Number(form.time_to_reach_goal_weeks),
        form.activity_level,
        profile.age,
        profile.height_cm,
        profile.gender,
      )
    : null;

  const previewChanged = preview &&
    Math.abs(preview.targetKcal - Math.round(profile.target_calories_kcal ?? 0)) > 5;

  async function handleSave() {
    if (!isDirty || saving) return;
    setSaving(true);
    try {
      await api.put("/api/v1/profile", {
        current_weight_kg:        Number(form.current_weight_kg),
        goal_weight_kg:           Number(form.goal_weight_kg),
        time_to_reach_goal_weeks: Number(form.time_to_reach_goal_weeks),
        activity_level:           form.activity_level,
        diet_type:                form.diet_type,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onSaved();
      toast("Goals updated — all targets recalculated", { duration: 3000 });
    } catch {
      toast.error("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "bg-[#222222] border-[#2A2A2A] focus:border-primary focus:ring-primary/20 text-sm h-10";

  return (
    <Card padding="md">
      <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-4">
        Update Goals
      </p>

      <div className="space-y-4 lg:max-w-lg lg:mx-auto">
        {/* Weight inputs — stack on mobile (narrow), side-by-side on sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Current weight (kg)
            </label>
            <Input
              type="number" step={0.1} min={30} max={250}
              value={form.current_weight_kg}
              onChange={e => set("current_weight_kg", e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Goal weight (kg)
            </label>
            <Input
              type="number" step={0.1} min={30} max={250}
              value={form.goal_weight_kg}
              onChange={e => set("goal_weight_kg", e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Timeline (weeks)
          </label>
          <Input
            type="number" step={1} min={4} max={104}
            value={form.time_to_reach_goal_weeks}
            onChange={e => set("time_to_reach_goal_weeks", e.target.value)}
            className={inputCls}
          />
          <p className="text-[10px] text-muted-foreground/50">Minimum 4 weeks</p>
        </div>

        {/* Activity level */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Activity level</label>
          <Select value={form.activity_level} onValueChange={(v: string | null) => v && set("activity_level", v)}>
            <SelectTrigger className={cn("w-full", inputCls)}>
              <span className="flex-1 text-left text-sm">
                {ACTIVITY_OPTIONS.find(o => o.value === form.activity_level)?.label ?? form.activity_level}
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
        </div>

        {/* Diet type */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Diet type</label>
          <Select value={form.diet_type} onValueChange={(v: string | null) => v && set("diet_type", v)}>
            <SelectTrigger className={cn("w-full", inputCls)}>
              <span className="flex-1 text-left text-sm">
                {DIET_OPTIONS.find(o => o.value === form.diet_type)?.label ?? form.diet_type}
              </span>
            </SelectTrigger>
            <SelectContent>
              {DIET_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Live impact preview */}
        <AnimatePresence>
          {previewChanged && isDirty && preview && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] px-4 py-3 space-y-1"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Preview — after saving
              </p>
              <div className="flex items-baseline gap-3 flex-wrap">
                <div>
                  <span className="text-lg font-black text-primary tabular-nums">
                    {preview.targetKcal.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">kcal/day target</span>
                </div>
                <span className={cn(
                  "text-xs font-medium",
                  preview.deficitKcal < 0 ? "text-primary/80" : "text-amber-400/80",
                )}>
                  {preview.deficitKcal < 0
                    ? `${Math.abs(preview.deficitKcal)} kcal deficit`
                    : `${preview.deficitKcal} kcal surplus`}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground/40">
                Was {Math.round(profile.target_calories_kcal ?? 0).toLocaleString()} kcal/day
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save button */}
        <Button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className={cn(
            "w-full h-11 font-semibold rounded-xl transition-all lg:max-w-xs lg:mx-auto lg:flex",
            saved
              ? "bg-green-500 text-black hover:bg-green-400"
              : "bg-primary text-black hover:bg-green-400",
            "disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]",
          )}
        >
          {saving ? (
            <span className="flex items-center gap-2 justify-center">
              <Spinner className="w-4 h-4" /> Saving…
            </span>
          ) : saved ? (
            <span className="flex items-center gap-2 justify-center">
              <Check size={16} /> Saved!
            </span>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </Card>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import Spinner from "@/components/ui/Spinner";
import StepIndicator from "./StepIndicator";
import Step1Personal from "./Step1Personal";
import Step2Weight from "./Step2Weight";
import Step3Fitness from "./Step3Fitness";
import Step4Diet from "./Step4Diet";
import { useProfile } from "@/hooks/useProfile";
import api from "@/lib/api";
import type { OnboardingFormData } from "@/types/profile";

const STEP_LABELS = ["Personal", "Weight", "Fitness", "Diet"];

const DEFAULT_FORM: OnboardingFormData = {
  name: "", age: "", gender: "",
  height_cm: "", current_weight_kg: "", goal_weight_kg: "",
  time_to_reach_goal_weeks: "", experience_level: "",
  activity_level: "", diet_type: "",
  wants_workout_split: false, wants_diet_plan: false,
};

type FormErrors = Partial<Record<keyof OnboardingFormData, string>>;

function validateStep(step: number, data: OnboardingFormData): FormErrors {
  const e: FormErrors = {};
  if (step === 0) {
    if (!data.name.trim())                                                           e.name         = "Name is required";
    if (data.age === "" || Number(data.age) < 10 || Number(data.age) > 120)        e.age          = "Enter a valid age (10–120)";
    if (!data.gender)                                                                e.gender       = "Select a gender";
    if (data.height_cm === "" || Number(data.height_cm) < 100 || Number(data.height_cm) > 250) e.height_cm = "Enter height in cm (100–250)";
  }
  if (step === 1) {
    if (data.current_weight_kg === "" || Number(data.current_weight_kg) < 30)       e.current_weight_kg        = "Enter current weight (≥ 30 kg)";
    if (data.goal_weight_kg === "" || Number(data.goal_weight_kg) < 30)             e.goal_weight_kg           = "Enter goal weight (≥ 30 kg)";
    if (data.time_to_reach_goal_weeks === "" || Number(data.time_to_reach_goal_weeks) < 4) e.time_to_reach_goal_weeks = "Minimum 4 weeks";
  }
  if (step === 2) {
    if (!data.experience_level) e.experience_level = "Select experience level";
    if (!data.activity_level)   e.activity_level   = "Select activity level";
  }
  if (step === 3) {
    if (!data.diet_type) e.diet_type = "Select a diet type";
  }
  return e;
}

export default function OnboardingWizard() {
  const router               = useRouter();
  const { profile }          = useProfile();
  const [step, setStep]      = useState(0);
  const [form, setForm]      = useState<OnboardingFormData>(DEFAULT_FORM);
  const [errors, setErrors]  = useState<FormErrors>({});
  const [submitting, setSub] = useState(false);
  const [apiError, setApiErr]= useState("");
  const direction            = useRef(1); // 1=forward, -1=back — ref avoids re-render

    // Pre-fill from existing profile (Re-do Onboarding flow)
  useEffect(() => {
    if (profile) {
      setForm({
        name:                    profile.name,
        age:                     profile.age as unknown as number | "",
        gender:                  profile.gender as OnboardingFormData["gender"],
        height_cm:               profile.height_cm as unknown as number | "",
        current_weight_kg:       profile.current_weight_kg as unknown as number | "",
        goal_weight_kg:          profile.goal_weight_kg as unknown as number | "",
        time_to_reach_goal_weeks:profile.time_to_reach_goal_weeks as unknown as number | "",
        experience_level:        profile.experience_level as OnboardingFormData["experience_level"],
        activity_level:          profile.activity_level as OnboardingFormData["activity_level"],
        diet_type:               profile.diet_type as OnboardingFormData["diet_type"],
        wants_workout_split:     profile.wants_workout_split,
        wants_diet_plan:         profile.wants_diet_plan,
      });
    }
  }, [profile?.user_id]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(updates: Partial<OnboardingFormData>) {
    setForm(prev => ({ ...prev, ...updates }));
    setErrors(prev => {
      const next = { ...prev };
      Object.keys(updates).forEach(k => delete next[k as keyof OnboardingFormData]);
      return next;
    });
    setApiErr("");
  }

  function handleNext() {
    const stepErrors = validateStep(step, form);
    if (Object.keys(stepErrors).length > 0) { setErrors(stepErrors); return; }
    direction.current = 1;
    setStep(s => s + 1);
  }

  function handleBack() {
    direction.current = -1;
    setErrors({});
    setStep(s => s - 1);
  }

  async function handleSubmit() {
    const stepErrors = validateStep(3, form);
    if (Object.keys(stepErrors).length > 0) { setErrors(stepErrors); return; }
    setSub(true);
    setApiErr("");
    try {
      await api.post("/api/v1/profile/onboarding", {
        ...form,
        age:                      Number(form.age),
        height_cm:                Number(form.height_cm),
        current_weight_kg:        Number(form.current_weight_kg),
        goal_weight_kg:           Number(form.goal_weight_kg),
        time_to_reach_goal_weeks: Number(form.time_to_reach_goal_weeks),
      });
      router.push("/dashboard");
    } catch {
      setApiErr("Something went wrong. Please try again.");
    } finally {
      setSub(false);
    }
  }

  const stepProps = { data: form, onChange: handleChange, errors };
  const isLastStep = step === STEP_LABELS.length - 1;

  return (
    // Outer: top-aligned on SE (scrollable), centred on 390px+
    <div className="min-h-dvh flex flex-col items-start justify-start sm:items-center sm:justify-center px-4 py-8 bg-[#0A0A0A]">
      <div className="w-full max-w-md bg-[#111111] border border-[#2A2A2A] rounded-2xl p-6 sm:p-8">

        {/* Logo + tagline */}
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center shrink-0">
            <span className="text-sm font-black text-primary select-none">F</span>
          </div>
          <span className="text-lg font-bold text-foreground">FitCoach</span>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Your personalised fitness journey starts here
        </p>

        {/* Step indicator */}
        <StepIndicator currentStep={step} totalSteps={4} labels={STEP_LABELS} />

        {/* Step content with directional slide */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: direction.current * 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction.current * 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {step === 0 && <Step1Personal {...stepProps} />}
            {step === 1 && <Step2Weight  {...stepProps} />}
            {step === 2 && <Step3Fitness {...stepProps} />}
            {step === 3 && <Step4Diet    {...stepProps} />}
          </motion.div>
        </AnimatePresence>

        {/* API error */}
        {apiError && (
          <p className="text-sm text-red-400 mt-3 text-center">{apiError}</p>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button
              onClick={handleBack}
              className="flex-1 h-11 rounded-xl bg-[#222222] border border-[#2A2A2A]
                         text-sm font-semibold text-foreground hover:bg-[#2A2A2A]
                         active:scale-[0.98] transition-all"
            >
              Back
            </button>
          )}
          <button
            onClick={isLastStep ? handleSubmit : handleNext}
            disabled={submitting}
            className="flex-1 h-11 rounded-xl bg-primary text-black font-semibold text-sm
                       hover:bg-green-400 active:scale-[0.98] transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Spinner className="w-4 h-4" />
                <span>Setting up your plan…</span>
              </>
            ) : isLastStep ? (
              "Start my journey"
            ) : (
              "Continue"
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

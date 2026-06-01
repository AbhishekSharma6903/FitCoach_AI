"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import StepIndicator from "./StepIndicator";
import Step1Personal from "./Step1Personal";
import Step2Weight from "./Step2Weight";
import Step3Fitness from "./Step3Fitness";
import Step4Diet from "./Step4Diet";
import Button from "@/components/ui/Button";
import api from "@/lib/api";
import type { OnboardingFormData } from "@/types/profile";

const STEP_LABELS = ["Personal", "Weight", "Fitness", "Diet"];

const DEFAULT_FORM: OnboardingFormData = {
  name: "", age: "", gender: "", height_cm: "",
  current_weight_kg: "", goal_weight_kg: "", time_to_reach_goal_weeks: "",
  experience_level: "", activity_level: "", diet_type: "",
  wants_workout_split: false, wants_diet_plan: false,
};

function validateStep(step: number, data: OnboardingFormData) {
  const errors: Partial<Record<keyof OnboardingFormData, string>> = {};
  if (step === 0) {
    if (!data.name.trim()) errors.name = "Name is required";
    if (data.age === "" || Number(data.age) < 10 || Number(data.age) > 120) errors.age = "Enter a valid age (10–120)";
    if (!data.gender) errors.gender = "Select a gender";
    if (data.height_cm === "" || Number(data.height_cm) < 100 || Number(data.height_cm) > 250) errors.height_cm = "Enter height in cm (100–250)";
  }
  if (step === 1) {
    if (data.current_weight_kg === "" || Number(data.current_weight_kg) < 30) errors.current_weight_kg = "Enter current weight";
    if (data.goal_weight_kg === "" || Number(data.goal_weight_kg) < 30) errors.goal_weight_kg = "Enter goal weight";
    if (data.time_to_reach_goal_weeks === "" || Number(data.time_to_reach_goal_weeks) < 4) errors.time_to_reach_goal_weeks = "Minimum 4 weeks";
  }
  if (step === 2) {
    if (!data.experience_level) errors.experience_level = "Select experience level";
    if (!data.activity_level) errors.activity_level = "Select activity level";
  }
  if (step === 3) {
    if (!data.diet_type) errors.diet_type = "Select a diet type";
  }
  return errors;
}

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<OnboardingFormData>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof OnboardingFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  function handleChange(updates: Partial<OnboardingFormData>) {
    setForm((prev) => ({ ...prev, ...updates }));
    const clearedErrors: Partial<Record<keyof OnboardingFormData, string>> = { ...errors };
    Object.keys(updates).forEach((k) => delete clearedErrors[k as keyof OnboardingFormData]);
    setErrors(clearedErrors);
  }

  function handleNext() {
    const stepErrors = validateStep(step, form);
    if (Object.keys(stepErrors).length > 0) { setErrors(stepErrors); return; }
    setStep((s) => s + 1);
  }

  function handleBack() { setStep((s) => s - 1); }

  async function handleSubmit() {
    const stepErrors = validateStep(3, form);
    if (Object.keys(stepErrors).length > 0) { setErrors(stepErrors); return; }
    setSubmitting(true);
    setApiError("");
    try {
      await api.post("/api/v1/profile/onboarding", {
        ...form,
        age: Number(form.age),
        height_cm: Number(form.height_cm),
        current_weight_kg: Number(form.current_weight_kg),
        goal_weight_kg: Number(form.goal_weight_kg),
        time_to_reach_goal_weeks: Number(form.time_to_reach_goal_weeks),
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setApiError(message);
    } finally {
      setSubmitting(false);
    }
  }

  const stepProps = { data: form, onChange: handleChange, errors };

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl shadow-card p-8">
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold gradient-text">FitCoach AI</h1>
          <p className="text-gray-500 text-sm mt-1">Your personalised fitness journey starts here</p>
        </div>

        <StepIndicator currentStep={step} totalSteps={4} labels={STEP_LABELS} />

        <div className="min-h-[320px]">
          {step === 0 && <Step1Personal {...stepProps} />}
          {step === 1 && <Step2Weight {...stepProps} />}
          {step === 2 && <Step3Fitness {...stepProps} />}
          {step === 3 && <Step4Diet {...stepProps} />}
        </div>

        {apiError && <p className="text-sm text-red-400 mt-4 text-center">{apiError}</p>}

        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <Button variant="secondary" onClick={handleBack} className="flex-1">Back</Button>
          )}
          {step < 3 ? (
            <Button onClick={handleNext} className="flex-1">Continue</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
              {submitting ? "Setting up your plan..." : "Start my journey"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, CheckCircle2, LogOut, RefreshCw } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useDashboard } from "@/hooks/useDashboard";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import FormField from "@/components/ui/FormField";
import Spinner from "@/components/ui/Spinner";
import api from "@/lib/api";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";

const ACTIVITY_OPTIONS = [
  { value: "sedentary",    label: "Sedentary (desk job, little exercise)" },
  { value: "light",        label: "Light (1–2 days/week)" },
  { value: "moderate",     label: "Moderate (3–5 days/week)" },
  { value: "intense",      label: "Intense (6–7 days/week)" },
  { value: "very_intense", label: "Very Intense (2× daily training)" },
];

const DIET_OPTIONS = [
  { value: "veg",     label: "Vegetarian" },
  { value: "egg",     label: "Eggetarian" },
  { value: "non_veg", label: "Non-Vegetarian" },
];

const GOAL_OPTIONS = [
  { value: "4",  label: "4 weeks" },
  { value: "8",  label: "8 weeks" },
  { value: "12", label: "12 weeks" },
  { value: "16", label: "16 weeks" },
  { value: "24", label: "24 weeks" },
  { value: "36", label: "36 weeks" },
  { value: "52", label: "52 weeks (1 year)" },
];

function StatBadge({ label, value, unit }: { label: string; value: string | number | null; unit?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 bg-gray-800 rounded-xl px-4 py-3 text-center min-w-[80px]">
      <span className="text-lg font-bold text-gray-100">
        {value != null ? value : "—"}
        {unit && value != null && <span className="text-xs text-gray-400 ml-0.5">{unit}</span>}
      </span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}

function SignOutButton() {
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    if (DEV_MODE) {
      window.location.href = "/sign-in";
      return;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { useClerk } = require("@clerk/nextjs");
      // Can't use hooks inside a non-component function — handled by ClerkSignOut below
    } catch {
      window.location.href = "/sign-in";
    } finally {
      setLoading(false);
    }
  }

  if (!DEV_MODE) {
    return <ClerkSignOutButton />;
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="w-full flex items-center gap-3 py-3 px-1 text-red-400 hover:text-red-300 transition-colors group"
    >
      <LogOut size={18} className="shrink-0" />
      <span className="text-sm font-medium">Sign Out</span>
    </button>
  );
}

function ClerkSignOutButton() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useClerk } = require("@clerk/nextjs");
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { signOut } = useClerk();
  return (
    <button
      onClick={() => signOut({ redirectUrl: "/sign-in" })}
      className="w-full flex items-center gap-3 py-3 px-1 text-red-400 hover:text-red-300 transition-colors"
    >
      <LogOut size={18} className="shrink-0" />
      <span className="text-sm font-medium">Sign Out</span>
    </button>
  );
}

export default function ProfilePage() {
  const { profile, isLoading, mutate: mutateProfile } = useProfile();
  const { mutate: mutateDashboard } = useDashboard();

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<{
    current_weight_kg: string;
    goal_weight_kg: string;
    time_to_reach_goal_weeks: string;
    activity_level: string;
    diet_type: string;
  } | null>(null);

  if (!form && profile) {
    setForm({
      current_weight_kg:        String(profile.current_weight_kg),
      goal_weight_kg:           String(profile.goal_weight_kg),
      time_to_reach_goal_weeks: String(profile.time_to_reach_goal_weeks),
      activity_level:           profile.activity_level,
      diet_type:                profile.diet_type,
    });
  }

  function update(key: string, value: string) {
    setForm((prev) => prev ? { ...prev, [key]: value } : prev);
    setSaved(false);
    setError("");
  }

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    setError("");
    try {
      await api.put("/api/v1/profile", {
        current_weight_kg:        Number(form.current_weight_kg),
        goal_weight_kg:           Number(form.goal_weight_kg),
        time_to_reach_goal_weeks: Number(form.time_to_reach_goal_weeks),
        activity_level:           form.activity_level,
        diet_type:                form.diet_type,
      });
      await mutateProfile();
      await mutateDashboard();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  const bmiClass =
    !profile.bmi ? "text-gray-100" :
    profile.bmi < 18.5 ? "text-blue-400" :
    profile.bmi < 25   ? "text-brand-400" :
    profile.bmi < 30   ? "text-amber-400" : "text-red-400";

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-300 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-100">Profile</h1>
          </div>
        </div>

        {/* Identity card */}
        <div className="flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-2xl px-5 py-4">
          <div className="w-12 h-12 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-xl shrink-0">
            {profile.name[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-100">{profile.name}</p>
            <p className="text-xs text-gray-500 capitalize mt-0.5">
              {profile.age} yrs · {profile.gender} · {profile.height_cm} cm
            </p>
          </div>
        </div>

        {/* Stats */}
        <Card padding="sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Your Stats</p>
          <div className="flex gap-2 flex-wrap">
            <StatBadge label="BMI"    value={profile.bmi?.toFixed(1) ?? null} />
            <StatBadge label="TDEE"   value={profile.tdee_kcal ? Math.round(profile.tdee_kcal) : null}              unit="kcal" />
            <StatBadge label="Target" value={profile.target_calories_kcal ? Math.round(profile.target_calories_kcal) : null} unit="kcal" />
            <StatBadge label="Protein" value={profile.protein_g ? Math.round(profile.protein_g) : null}             unit="g" />
            <StatBadge label="Carbs"  value={profile.carbs_g ? Math.round(profile.carbs_g) : null}                  unit="g" />
            <StatBadge label="Fat"    value={profile.fat_g ? Math.round(profile.fat_g) : null}                      unit="g" />
          </div>
          {profile.bmi && (
            <p className={`text-xs mt-3 ${bmiClass}`}>
              BMI {profile.bmi.toFixed(1)} —{" "}
              {profile.bmi < 18.5 ? "Underweight" :
               profile.bmi < 25   ? "Healthy weight" :
               profile.bmi < 30   ? "Overweight" : "Obese"}
            </p>
          )}
        </Card>

        {/* Edit goals */}
        {form && (
          <Card>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Update Goals</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Current Weight (kg)">
                  <Input type="number" step={0.1} min={30} max={300}
                    value={form.current_weight_kg}
                    onChange={(e) => update("current_weight_kg", e.target.value)}
                    placeholder="e.g. 72.5" />
                </FormField>
                <FormField label="Goal Weight (kg)">
                  <Input type="number" step={0.1} min={30} max={300}
                    value={form.goal_weight_kg}
                    onChange={(e) => update("goal_weight_kg", e.target.value)}
                    placeholder="e.g. 65.0" />
                </FormField>
              </div>
              <FormField label="Timeline">
                <Select options={GOAL_OPTIONS} value={form.time_to_reach_goal_weeks}
                  onChange={(e) => update("time_to_reach_goal_weeks", e.target.value)} />
              </FormField>
              <FormField label="Activity Level">
                <Select options={ACTIVITY_OPTIONS} value={form.activity_level}
                  onChange={(e) => update("activity_level", e.target.value)} />
              </FormField>
              <FormField label="Diet Type">
                <Select options={DIET_OPTIONS} value={form.diet_type}
                  onChange={(e) => update("diet_type", e.target.value)} />
              </FormField>
            </div>
            {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
            <div className="mt-5">
              <Button onClick={handleSave} disabled={saving} className="w-full flex items-center justify-center gap-2">
                {saving   ? <><Spinner className="w-4 h-4" /> Saving…</> :
                 saved    ? <><CheckCircle2 size={16} /> Saved!</> :
                            <><Save size={16} /> Save Changes</>}
              </Button>
            </div>
          </Card>
        )}

        {/* Account */}
        <Card padding="sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Account</p>
          <Link
            href="/onboarding"
            className="flex items-center gap-3 py-3 px-1 text-gray-400 hover:text-gray-200 transition-colors border-b border-gray-800"
          >
            <RefreshCw size={18} className="shrink-0 text-gray-600" />
            <div className="flex-1">
              <p className="text-sm font-medium">Re-do Onboarding</p>
              <p className="text-xs text-gray-600">Change name, age, height, experience level</p>
            </div>
            <span className="text-gray-700 text-sm">›</span>
          </Link>
          <SignOutButton />
        </Card>

        {/* Dev mode notice */}
        {DEV_MODE && (
          <div className="rounded-xl border border-amber-800/60 bg-amber-900/20 px-4 py-3">
            <p className="text-xs font-semibold text-amber-400 mb-0.5">Dev Mode Active</p>
            <p className="text-xs text-amber-600">
              Clerk auth bypassed. All requests use <code className="text-amber-400">DEV_USER_ID=dev-user-001</code>.
              Set <code className="text-amber-400">NEXT_PUBLIC_DEV_MODE=false</code> to enable real auth.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

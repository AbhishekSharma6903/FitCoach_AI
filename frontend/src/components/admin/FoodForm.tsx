"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { AdminFoodItem, AdminFoodCreate } from "@/hooks/useAdminFood";

type FormMode = "create" | "edit";

interface FoodFormProps {
  mode:     FormMode;
  initial?: AdminFoodItem | null;
  onSave:   (payload: AdminFoodCreate, id?: number) => Promise<void>;
  onCancel: () => void;
}

const EMPTY: AdminFoodCreate = {
  name: "", category: "", region: "", serving_size_g: 100,
  calories_kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0,
  fiber_g: 0, sugar_g: 0, is_veg: true, is_egg: false,
};

function numOr0(v: unknown): number {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function LabelInput({
  label, field, value, onChange, type = "text", required = false, step,
}: {
  label: string; field: string; value: string | number;
  onChange: (val: string) => void; type?: string;
  required?: boolean; step?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={field} className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        id={field}
        type={type}
        step={step}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={cn(
          "h-9 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] text-foreground",
          "px-3 text-sm placeholder:text-muted-foreground/50",
          "outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors",
        )}
      />
    </div>
  );
}

function Toggle({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors",
        checked
          ? "bg-primary/10 text-primary border-primary/30"
          : "bg-[#1A1A1A] text-muted-foreground border-[#2A2A2A] hover:text-foreground",
      )}
    >
      <span className={cn(
        "w-2 h-2 rounded-full",
        checked ? "bg-primary" : "bg-muted-foreground/30",
      )} />
      {label}
    </button>
  );
}

export default function FoodForm({ mode, initial, onSave, onCancel }: FoodFormProps) {
  const [form, setForm]     = useState<AdminFoodCreate>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (mode === "edit" && initial) {
      setForm({
        name:           initial.name,
        category:       initial.category ?? "",
        region:         initial.region ?? "",
        serving_size_g: initial.serving_size_g,
        calories_kcal:  initial.calories_kcal,
        protein_g:      initial.protein_g,
        carbs_g:        initial.carbs_g,
        fat_g:          initial.fat_g,
        fiber_g:        initial.fiber_g,
        sugar_g:        initial.sugar_g,
        is_veg:         initial.is_veg,
        is_egg:         initial.is_egg,
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [mode, initial]);

  function set(field: keyof AdminFoodCreate, value: string | number | boolean) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim())           e.name = "Required";
    if (form.serving_size_g <= 0)    e.serving_size_g = "Must be > 0";
    if (form.calories_kcal < 0)      e.calories_kcal = "Must be ≥ 0";
    if (form.protein_g < 0)          e.protein_g = "Must be ≥ 0";
    if (form.carbs_g < 0)            e.carbs_g = "Must be ≥ 0";
    if (form.fat_g < 0)              e.fat_g = "Must be ≥ 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave(form, mode === "edit" ? initial?.id : undefined);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl bg-[#111111] border border-[#2A2A2A] p-5 space-y-4">
      <p className="text-sm font-bold text-foreground">
        {mode === "create" ? "Add Food" : "Edit Food"}
      </p>

      {/* Name */}
      <div>
        <LabelInput label="Name" field="name" value={form.name}
          onChange={v => set("name", v)} required />
        {errors.name && <p className="text-[10px] text-red-400 mt-0.5">{errors.name}</p>}
      </div>

      {/* Category + Region — free text (DB has 60+ varied category strings) */}
      <div className="grid grid-cols-2 gap-3">
        <LabelInput label="Category" field="category" value={form.category}
          onChange={v => set("category", v)} />
        <LabelInput label="Region" field="region" value={form.region}
          onChange={v => set("region", v)} />
      </div>

      {/* Serving size */}
      <div>
        <LabelInput label="Serving size (g)" field="serving_size_g" type="number"
          step="0.01" value={form.serving_size_g}
          onChange={v => set("serving_size_g", numOr0(v))} required />
        {errors.serving_size_g && <p className="text-[10px] text-red-400 mt-0.5">{errors.serving_size_g}</p>}
      </div>

      {/* Macros grid */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <LabelInput label="Calories (kcal)" field="calories_kcal" type="number"
            step="0.01" value={form.calories_kcal}
            onChange={v => set("calories_kcal", numOr0(v))} required />
          {errors.calories_kcal && <p className="text-[10px] text-red-400 mt-0.5">{errors.calories_kcal}</p>}
        </div>
        <div>
          <LabelInput label="Protein (g)" field="protein_g" type="number"
            step="0.01" value={form.protein_g}
            onChange={v => set("protein_g", numOr0(v))} required />
          {errors.protein_g && <p className="text-[10px] text-red-400 mt-0.5">{errors.protein_g}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <LabelInput label="Carbs (g)" field="carbs_g" type="number"
            step="0.01" value={form.carbs_g}
            onChange={v => set("carbs_g", numOr0(v))} required />
          {errors.carbs_g && <p className="text-[10px] text-red-400 mt-0.5">{errors.carbs_g}</p>}
        </div>
        <div>
          <LabelInput label="Fat (g)" field="fat_g" type="number"
            step="0.01" value={form.fat_g}
            onChange={v => set("fat_g", numOr0(v))} required />
          {errors.fat_g && <p className="text-[10px] text-red-400 mt-0.5">{errors.fat_g}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <LabelInput label="Fiber (g)" field="fiber_g" type="number"
          step="0.01" value={form.fiber_g}
          onChange={v => set("fiber_g", numOr0(v))} />
        <LabelInput label="Sugar (g)" field="sugar_g" type="number"
          step="0.01" value={form.sugar_g}
          onChange={v => set("sugar_g", numOr0(v))} />
      </div>

      {/* Diet toggles */}
      <div className="flex items-center gap-2 flex-wrap">
        <Toggle label="Veg"   checked={form.is_veg} onChange={v => set("is_veg", v)} />
        <Toggle label="Egg"   checked={form.is_egg} onChange={v => set("is_egg", v)} />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className={cn(
            "flex-1 h-10 rounded-xl text-sm font-medium transition-colors",
            "bg-[#1A1A1A] border border-[#2A2A2A] text-muted-foreground hover:text-foreground",
          )}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            "flex-1 h-10 rounded-xl text-sm font-semibold transition-colors",
            "bg-primary text-black hover:bg-green-400 disabled:opacity-50",
          )}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

"use client";

import { motion } from "motion/react";
import Card from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types/profile";

interface MacrosCardProps {
  profile: UserProfile;
}

interface MacroRowProps {
  label: string;
  grams: number | null | undefined;
  maxGrams: number;  // reference max for the bar (use highest macro target)
  colour: string;
  textColour: string;
  kcalPerG: number;
  totalKcal: number;
}

function MacroRow({ label, grams, maxGrams, colour, textColour, kcalPerG, totalKcal }: MacroRowProps) {
  const g = grams ? Math.round(grams) : 0;
  // Bar fills relative to max macro target, not calorie %, so bars look proportional
  const barPct = maxGrams > 0 ? Math.min(Math.round((g / maxGrams) * 100), 100) : 0;
  // Calorie % for the label
  const calPct = totalKcal > 0 ? Math.round((g * kcalPerG / totalKcal) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <span className={cn("text-xs font-medium w-14 shrink-0", textColour)}>{label}</span>

      {/* bar */}
      <div className="flex-1 h-1.5 rounded-full bg-[#2A2A2A] overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", colour)}
          initial={{ width: 0 }}
          animate={{ width: `${barPct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      <div className="flex items-baseline gap-1 shrink-0">
        <span className="text-sm font-bold text-white tabular-nums">{g}g</span>
        <span className="text-[10px] text-muted-foreground/50">{calPct}%</span>
      </div>
    </div>
  );
}

export default function MacrosCard({ profile }: MacrosCardProps) {
  const totalKcal = profile.target_calories_kcal ?? 0;
  const maxGrams  = Math.max(
    profile.carbs_g ?? 0,
    profile.protein_g ?? 0,
    profile.fat_g ?? 0,
    1,
  );

  if (!profile.protein_g && !profile.carbs_g && !profile.fat_g) return null;

  return (
    <Card padding="md">
      <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-3">
        Daily Macro Targets
      </p>

      <div className="space-y-2.5">
        <MacroRow
          label="Protein"
          grams={profile.protein_g}
          maxGrams={maxGrams}
          kcalPerG={4}
          totalKcal={totalKcal}
          colour="bg-blue-500"
          textColour="text-blue-400"
        />
        <MacroRow
          label="Carbs"
          grams={profile.carbs_g}
          maxGrams={maxGrams}
          kcalPerG={4}
          totalKcal={totalKcal}
          colour="bg-amber-400"
          textColour="text-amber-400"
        />
        <MacroRow
          label="Fat"
          grams={profile.fat_g}
          maxGrams={maxGrams}
          kcalPerG={9}
          totalKcal={totalKcal}
          colour="bg-orange-500"
          textColour="text-orange-400"
        />
      </div>

      <p className="text-[10px] text-muted-foreground/40 mt-3">
        Recalculated automatically each time you save your goals.
      </p>
    </Card>
  );
}

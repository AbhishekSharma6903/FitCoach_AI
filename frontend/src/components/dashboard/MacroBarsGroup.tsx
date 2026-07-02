"use client";
import MacroBar from "./MacroBar";
import type { MacroSnapshot } from "@/types/dashboard";

interface Props {
  consumed: MacroSnapshot;
  target: MacroSnapshot;
}

export default function MacroBarsGroup({ consumed, target }: Props) {
  return (
    <div className="space-y-4">
      <MacroBar label="Protein" consumed={consumed.protein_g} target={target.protein_g} color="bg-blue-500" />
      <MacroBar label="Carbs" consumed={consumed.carbs_g} target={target.carbs_g} color="bg-amber-400" />
      <MacroBar label="Fat" consumed={consumed.fat_g} target={target.fat_g} color="bg-orange-500" />
    </div>
  );
}
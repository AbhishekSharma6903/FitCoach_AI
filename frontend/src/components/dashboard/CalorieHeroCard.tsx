"use client";

import { motion } from "motion/react";
import { Progress } from "@/components/ui/progress";
import Card from "@/components/ui/Card";
import CalorieRing from "./CalorieRing";
import CountUp from "./CountUp";
import { cn } from "@/lib/utils";

interface CalorieHeroCardProps {
  consumed: number;
  target: number;
  burned: number;
}

interface StatBlockProps {
  label: string;
  value: number;
  valueColor?: string;
  size: "3xl" | "4xl";
}

function StatBlock({ label, value, valueColor = "text-white", size }: StatBlockProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <CountUp
        to={value}
        duration={1.1}
        className={cn(
          "font-black tabular-nums leading-none",
          size === "4xl" ? "text-4xl" : "text-3xl",
          valueColor,
        )}
      />
      <span className="text-xs text-muted-foreground">kcal</span>
    </div>
  );
}

export default function CalorieHeroCard({
  consumed,
  target,
  burned,
}: CalorieHeroCardProps) {
  const net = Math.max(0, consumed - burned);
  const pct = target > 0 ? Math.min(net / target, 1) : 0;
  const isOver = consumed > target;
  const remaining = Math.max(0, target - net);
  const over = Math.max(0, net - target);

  return (
    <Card padding="md" className="space-y-4">
      {/* Mobile layout: ring centred, stats below */}
      <div className="lg:hidden flex flex-col items-center gap-4">
        <CalorieRing consumed={consumed} target={target} burned={burned} size={140} />
        <div className="grid grid-cols-2 w-full gap-4">
          <StatBlock label="Consumed" value={consumed} size="3xl" />
          <StatBlock
            label={isOver ? "Over by" : "Remaining"}
            value={isOver ? over : remaining}
            size="3xl"
            valueColor={isOver ? "text-red-400" : "text-primary"}
          />
        </div>
      </div>

      {/* Desktop layout: cap inner content width so ring isn't dwarfed in 788px column */}
      <div className="hidden lg:flex justify-center">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-6 items-center w-full max-w-2xl">
          <StatBlock label="Consumed" value={consumed} size="4xl" />
          <CalorieRing consumed={consumed} target={target} burned={burned} size={200} />
          <StatBlock
            label={isOver ? "Over by" : "Remaining"}
            value={isOver ? over : remaining}
            size="4xl"
            valueColor={isOver ? "text-red-400" : "text-primary"}
          />
        </div>
      </div>

      {/* Progress bar + caption — full width, always */}
      <div className="space-y-1.5">
        <div className="h-2 w-full rounded-full bg-[#2A2A2A] overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full", isOver ? "bg-red-500" : "bg-primary")}
            initial={{ width: 0 }}
            animate={{ width: `${pct * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-center">
          of {Math.round(target).toLocaleString()} kcal goal
          {burned > 0 && ` · Net: ${Math.round(net).toLocaleString()} kcal`}
        </p>
      </div>
    </Card>
  );
}

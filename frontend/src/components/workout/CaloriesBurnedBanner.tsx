"use client";

import { motion } from "motion/react";
import { Flame } from "lucide-react";

interface CaloriesBurnedBannerProps {
  totalKcal: number;
}

export default function CaloriesBurnedBanner({ totalKcal }: CaloriesBurnedBannerProps) {
  if (totalKcal <= 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-2.5 px-4 py-3 rounded-xl
                 bg-orange-500/10 border border-orange-500/20"
    >
      <Flame size={16} className="text-orange-400 shrink-0" aria-hidden="true" />
      <span className="text-sm font-semibold text-orange-400">
        {Math.round(totalKcal).toLocaleString()} kcal burned today
      </span>
    </motion.div>
  );
}

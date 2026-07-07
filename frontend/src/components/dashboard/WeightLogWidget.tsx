"use client";

import { useState } from "react";
import { Scale, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Card from "@/components/ui/Card";
import { useWeightLog } from "@/hooks/useWeightLog";
import { cn } from "@/lib/utils";

export default function WeightLogWidget() {
  const { logWeight } = useWeightLog();
  const [value, setValue] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleLog() {
    const kg = Number(value);
    if (!kg || kg <= 0 || kg > 500) return;
    setSaving(true);
    try {
      await logWeight(kg);
      setValue("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card padding="md" className="space-y-3">
      <div className="flex items-center gap-2">
        <Scale size={13} className="text-muted-foreground" aria-hidden="true" />
        <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">
          Log Weight
        </p>
      </div>
      <div className="flex gap-2">
        <Input
          type="number"
          step={0.1}
          min={20}
          max={500}
          placeholder="kg"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLog()}
          aria-label="Your weight in kg"
          className="bg-[#1A1A1A] border-[#2A2A2A] focus:border-primary focus:ring-primary/20"
        />
        <Button
          onClick={handleLog}
          disabled={!value || saving}
          size="sm"
          className={cn(
            "shrink-0 px-3 transition-all",
            saved
              ? "bg-primary/20 text-primary border border-primary/30 hover:bg-primary/20"
              : "bg-[#222222] border border-[#2A2A2A] text-white hover:bg-[#2A2A2A]",
          )}
        >
          {saved ? <Check size={14} /> : saving ? "…" : "Log"}
        </Button>
      </div>
    </Card>
  );
}

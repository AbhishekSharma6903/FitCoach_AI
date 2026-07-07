import { ChefHat } from "lucide-react";

export default function InfoBanner() {
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20">
      <ChefHat size={16} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">
        Custom dishes appear in food search when you log meals in the Tracker.
        Build once, log forever.
      </p>
    </div>
  );
}

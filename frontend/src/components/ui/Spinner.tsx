import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  /** Screen-reader label */
  label?: string;
}

export default function Spinner({ className, label = "Loading…" }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className="inline-flex">
      <Loader2
        className={cn("animate-spin text-primary", className ?? "w-6 h-6")}
        aria-hidden="true"
      />
    </span>
  );
}

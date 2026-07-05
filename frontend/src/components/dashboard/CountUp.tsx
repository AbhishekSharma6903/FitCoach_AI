"use client";

import { useEffect, useRef } from "react";
import { animate } from "motion/react";

interface CountUpProps {
  to: number;
  duration?: number;
  className?: string;
}

/**
 * Animates a number from 0 to `to` on mount, and re-animates when `to` changes.
 * Uses Motion's animate() with onUpdate — correct pattern per AG-6.
 */
export default function CountUp({ to, duration = 1.2, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const prevRef = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const from = prevRef.current;
    prevRef.current = to;

    const ctrl = animate(from, to, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => {
        if (el) el.textContent = Math.round(v).toLocaleString();
      },
    });
    return () => ctrl.stop();
  }, [to, duration]);

  return (
    <span ref={ref} className={className}>
      {Math.round(to).toLocaleString()}
    </span>
  );
}

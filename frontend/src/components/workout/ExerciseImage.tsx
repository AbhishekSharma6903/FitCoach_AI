"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { getCategoryStyle } from "@/lib/workoutUtils";

interface ExerciseImageProps {
  name: string;
  imageUrl?: string | null;
  category: string;
  /** sm = 36px (WorkoutLogCard header), md = 44px (reserved for future) */
  size?: "sm" | "md";
  className?: string;
}

const SIZE_MAP = {
  sm: "w-9 h-9",
  md: "w-11 h-11",
};

/**
 * Renders a wger exercise thumbnail when imageUrl is available.
 * Falls back to the existing coloured-initial letter when:
 *   - imageUrl is null/undefined
 *   - the CDN image fails to load (onError)
 *
 * Both elements are always in the DOM simultaneously to avoid layout shift.
 * The fallback starts hidden when imageUrl is set; onError reveals it.
 */
export default function ExerciseImage({
  name,
  imageUrl,
  category,
  size = "sm",
  className,
}: ExerciseImageProps) {
  const fallbackRef = useRef<HTMLDivElement>(null);
  const imgRef      = useRef<HTMLImageElement>(null);
  const style       = getCategoryStyle(category);
  const sizeClass   = SIZE_MAP[size];

  function handleError() {
    if (imgRef.current)      imgRef.current.style.display = "none";
    if (fallbackRef.current) fallbackRef.current.style.display = "flex";
  }

  return (
    <div className={cn("relative shrink-0", sizeClass, className)}>
      {/* Real image — shown when imageUrl is set */}
      {imageUrl && (
        <img
          ref={imgRef}
          src={imageUrl}
          alt={name}
          loading="lazy"
          onError={handleError}
          className={cn(
            "rounded-xl object-cover absolute inset-0",
            sizeClass,
          )}
        />
      )}

      {/* Fallback: coloured initial letter — accessible when image is absent/failed */}
      <div
        ref={fallbackRef}
        role="img"
        aria-label={name}
        style={{ display: imageUrl ? "none" : "flex" }}
        className={cn(
          "rounded-xl items-center justify-center font-black text-sm absolute inset-0",
          sizeClass,
          style.bg,
          style.text,
        )}
      >
        {name[0]?.toUpperCase() ?? "?"}
      </div>
    </div>
  );
}

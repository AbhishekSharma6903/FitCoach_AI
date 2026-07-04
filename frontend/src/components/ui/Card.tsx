import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Inner padding size. Defaults to "md" (p-5). */
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingMap = {
  none: "",
  sm:   "p-3",
  md:   "p-5",
  lg:   "p-6",
};

/**
 * Base card surface — Level 1 (#111111) with subtle border.
 * Follows the design token system: no shadow, border-only depth cue.
 */
export default function Card({
  padding = "md",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-[#111111] border border-[#2A2A2A]",
        paddingMap[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

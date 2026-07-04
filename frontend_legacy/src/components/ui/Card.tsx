import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "sm" | "md" | "lg";
}

const paddingSizes = { sm: "p-3", md: "p-5", lg: "p-6" };

export default function Card({ className, padding = "md", children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-gray-900 border border-gray-800 shadow-card",
        paddingSizes[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

import { cn } from "@/lib/utils";
import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, options, placeholder, ...props }, ref) => (
    <div className="w-full">
      <select
        ref={ref}
        className={cn(
          "w-full rounded-xl px-3 py-2 text-sm outline-none transition-all duration-150",
          "bg-gray-800 border border-gray-700 text-gray-100",
          "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
          error && "border-red-500",
          className
        )}
        {...props}
      >
        {placeholder && <option value="" className="text-gray-500">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-gray-800 text-gray-100">{o.label}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
);
Select.displayName = "Select";
export default Select;

import React from "react";
import { cn } from "./cn";
import { ChevronDown } from "lucide-react";

const Select = React.forwardRef(function Select(
  { label, error, options = [], className = "", id, wrapperClassName, ...props },
  ref
) {
  const selectId = id || props.name || `select-${label?.replace(/\s/g, "-")}`;
  return (
    <div className={cn("w-full", wrapperClassName)}>
      {label ? (
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          {label}
        </label>
      ) : null}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "w-full appearance-none rounded-xl border-2 border-slate-200 bg-slate-50/80 px-4 py-2.5 pr-10 text-sm text-slate-900 transition-colors",
            "focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10",
            error && "border-red-400",
            className
          )}
          {...props}
        >
          {options.map((opt) => {
            const v = typeof opt === "string" ? opt : opt.value;
            const lab = typeof opt === "string" ? opt : opt.label;
            const disabled = typeof opt === "object" && opt.disabled;
            return (
              <option key={String(v)} value={v} disabled={disabled}>
                {lab}
              </option>
            );
          })}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
      </div>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
});

export default Select;

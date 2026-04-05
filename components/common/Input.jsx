import React from "react";
import { cn } from "./cn";

const Input = React.forwardRef(function Input(
  {
    label,
    error,
    hint,
    className = "",
    id,
    wrapperClassName,
    ...props
  },
  ref
) {
  const inputId = id || props.name || `input-${label?.replace(/\s/g, "-")}`;
  return (
    <div className={cn("w-full", wrapperClassName)}>
      {label ? (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          "w-full rounded-xl border-2 border-slate-200 bg-slate-50/80 px-4 py-2.5 text-sm text-slate-900 transition-colors",
          "placeholder:text-slate-400",
          "focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10",
          error && "border-red-400 focus:border-red-500 focus:ring-red-500/10",
          className
        )}
        {...props}
      />
      {hint && !error ? (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      ) : null}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
});

export default Input;

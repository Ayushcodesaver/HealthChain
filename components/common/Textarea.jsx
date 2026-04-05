import React from "react";
import { cn } from "./cn";

const Textarea = React.forwardRef(function Textarea(
  { label, error, hint, className = "", id, wrapperClassName, rows = 4, ...props },
  ref
) {
  const tid = id || props.name || `textarea-${label?.replace(/\s/g, "-")}`;
  return (
    <div className={cn("w-full", wrapperClassName)}>
      {label ? (
        <label htmlFor={tid} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={tid}
        rows={rows}
        className={cn(
          "w-full resize-y rounded-xl border-2 border-slate-200 bg-slate-50/80 px-4 py-2.5 text-sm text-slate-900 transition-colors",
          "placeholder:text-slate-400",
          "focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10",
          error && "border-red-400 focus:border-red-500 focus:ring-red-500/10",
          className
        )}
        {...props}
      />
      {hint && !error ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
});

export default Textarea;

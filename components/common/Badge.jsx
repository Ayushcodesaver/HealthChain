import React from "react";
import { cn } from "./cn";

const variants = {
  default: "bg-slate-100 text-slate-700 border-slate-200",
  success: "bg-emerald-50 text-emerald-800 border-emerald-200",
  warning: "bg-amber-50 text-amber-900 border-amber-200",
  danger: "bg-red-50 text-red-800 border-red-200",
  info: "bg-cyan-50 text-cyan-900 border-cyan-200",
  teal: "bg-teal-50 text-teal-800 border-teal-200",
  role: "bg-indigo-50 text-indigo-800 border-indigo-200",
};

const Badge = ({
  children,
  variant = "default",
  className = "",
  dot,
  dotClass = "bg-emerald-500",
}) => {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        variants[variant] || variants.default,
        className
      )}
    >
      {dot ? (
        <span className={cn("h-1.5 w-1.5 rounded-full", dotClass)} aria-hidden />
      ) : null}
      {children}
    </span>
  );
};

export default Badge;

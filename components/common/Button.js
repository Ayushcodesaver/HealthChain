import React from "react";
import { cn } from "./cn";

const variants = {
  primary:
    "bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md shadow-teal-500/25 hover:shadow-lg hover:shadow-teal-500/30 hover:from-teal-600 hover:to-cyan-700",
  secondary:
    "bg-slate-900 text-white hover:bg-slate-800 shadow-md",
  outline:
    "border-2 border-teal-500/40 text-teal-700 bg-white hover:bg-teal-50",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
  danger:
    "bg-red-500 text-white hover:bg-red-600 shadow-md",
  soft: "bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-100",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-5 py-2.5 text-sm rounded-xl",
  lg: "px-6 py-3 text-base rounded-xl",
};

const Button = ({
  children,
  onClick,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  disabled = false,
  ...rest
}) => {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        className
      )}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;

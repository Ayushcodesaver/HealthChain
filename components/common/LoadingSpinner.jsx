import React from "react";
import { cn } from "./cn";

const LoadingSpinner = ({ className = "", label = "Loading" }) => {
  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-3", className)}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div
        className="h-10 w-10 animate-spin rounded-full border-[3px] border-teal-200 border-t-teal-600"
        aria-hidden
      />
      <span className="sr-only">{label}</span>
    </div>
  );
};

export default LoadingSpinner;

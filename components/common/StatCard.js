import React from "react";
import { cn } from "./cn";

const StatCard = ({
  title,
  value,
  icon,
  subtitle,
  gradientClass = "bg-gradient-to-br from-teal-500 to-cyan-600",
  className = "",
}) => {
  return (
    <div
      className={cn(
        "p-6 rounded-2xl text-white card-hover relative overflow-hidden shadow-health",
        gradientClass,
        className
      )}
    >
      <div className="flex items-center justify-between z-10 relative">
        <div>
          <p className="text-white/85 text-xs font-semibold uppercase tracking-wider mb-1">
            {title}
          </p>
          <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
          {subtitle ? (
            <p className="text-white/75 text-sm mt-1">{subtitle}</p>
          ) : null}
        </div>
        <div className="text-white/95 text-4xl p-3 bg-white/15 rounded-xl backdrop-blur-sm border border-white/20">
          {icon}
        </div>
      </div>
      <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full blur-2xl" />
    </div>
  );
};

export default StatCard;

import React from "react";
import { cn } from "./cn";

const Card = ({
  children,
  className = "",
  title,
  subtitle,
  action,
  padding = "p-6",
  ...rest
}) => {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white border border-slate-200/80 shadow-health",
        className
      )}
      {...rest}
    >
      {(title || subtitle || action) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            {title ? (
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            ) : null}
            {subtitle ? (
              <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      <div className={padding}>{children}</div>
    </div>
  );
};

export default Card;

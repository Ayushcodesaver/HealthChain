import React, { useRef } from "react";
import { Upload } from "lucide-react";
import { cn } from "./cn";

const FileUpload = ({
  label = "Upload file",
  accept,
  onFile,
  onFiles,
  multiple = false,
  successHighlight = false,
  className = "",
  disabled,
}) => {
  const inputRef = useRef(null);

  return (
    <div className={cn("w-full", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 transition-colors",
          successHighlight
            ? "border-emerald-400 bg-emerald-50/60 hover:border-emerald-500 hover:bg-emerald-50/80"
            : "border-slate-200 bg-slate-50/80 hover:border-teal-400 hover:bg-teal-50/30",
          "focus:outline-none focus:ring-4 focus:ring-teal-500/15",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <Upload className="h-8 w-8 text-teal-600" />
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-xs text-slate-500">
          {multiple ? "Choose one or more files — PDF, PNG, JPG up to 10MB" : "PDF, PNG, JPG up to 10MB"}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const list = e.target.files;
          if (!list?.length) {
            e.target.value = "";
            return;
          }
          if (multiple && onFiles) {
            onFiles(Array.from(list));
          } else {
            const f = list[0];
            if (f) onFile?.(f);
          }
          e.target.value = "";
        }}
      />
    </div>
  );
};

export default FileUpload;

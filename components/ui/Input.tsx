import { clsx } from "clsx";
import { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const baseClass =
  "w-full rounded-lg border border-white/40 bg-white/60 backdrop-blur-sm px-3 py-2 text-sm text-sky-950 placeholder:text-sky-700/50 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300/30 disabled:bg-white/30 disabled:cursor-not-allowed";

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s/g, "-");
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-sky-900">
          {label}
        </label>
      )}
      <input id={inputId} className={clsx(baseClass, error && "border-red-400 focus:border-red-400 focus:ring-red-100", className)} {...props} />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s/g, "-");
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-sky-900">
          {label}
        </label>
      )}
      <textarea id={inputId} className={clsx(baseClass, "resize-none", error && "border-red-400", className)} {...props} />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

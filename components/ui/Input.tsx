"use client";
import { clsx } from "clsx";
import { Eye, EyeOff } from "lucide-react";
import { InputHTMLAttributes, TextareaHTMLAttributes, useState } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const baseClass =
  "w-full rounded-lg border border-sky-200 bg-white/60 backdrop-blur-sm px-3 py-2 text-sm text-sky-950 placeholder:text-sm placeholder:text-sky-700/50 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300/30 disabled:bg-white/30 disabled:cursor-not-allowed";

export function Input({ label, error, className, id, type, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s/g, "-");
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && show ? "text" : type;
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-sky-900">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type={inputType}
          className={clsx(
            baseClass,
            isPassword && "pr-10",
            error && "border-red-400 focus:border-red-400 focus:ring-red-100",
            className,
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            tabIndex={-1}
            aria-label={show ? "Nascondi password" : "Mostra password"}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-sky-500 hover:text-sky-700"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
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

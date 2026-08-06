"use client";
import { clsx } from "clsx";
import { Eye, EyeOff } from "lucide-react";
import { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes, useState } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Stringa nel 99% dei casi; ReactNode per etichette con icona (es. lucchetto) */
  label?: ReactNode;
  error?: string;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

// py-1.5 su mobile (~34px di altezza) → py-2 da sm in su: i form sono lunghi e
// su telefono ogni campo in meno di 4px si sente sullo scroll totale.
// I testi sono in `em` invece che in `text-sm`/`text-xs`: a font-size ereditato
// 16px valgono esattamente quanto prima (0.875em = 14px, 0.75em = 12px), ma un
// contenitore che rimpicciolisce la propria base — es. il `<form>` del RecipeForm —
// li scala tutti insieme senza dover toccare una classe per volta.
// Il testo *dentro* al campo ha un knob a parte (`--field-font-size`): dentro un
// form fitto i campi vogliono stare più bassi del resto della scala, ma senza il
// var toccarlo qui cambierebbe anche login/profilo/menù. Default = 0.875em (ex text-sm).
const baseClass =
  "w-full rounded-lg border border-sky-200 bg-white/60 backdrop-blur-sm px-3 py-1.5 sm:py-2 text-[length:var(--field-font-size,0.875em)] text-sky-950 placeholder:text-sky-700/50 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300/30 disabled:bg-white/30 disabled:cursor-not-allowed";

/**
 * Altezza fissa opzionale del campo (`--field-h`): senza il var resta `auto`, cioè
 * l'altezza data dal padding di sempre. Un gruppo "compatto" la imposta una volta
 * sola sul contenitore e tutti i suoi campi vengono alti uguali — anche quelli
 * inline delle righe, che usano lo stesso valore. Solo `<input>`: la `Textarea`
 * deve poter crescere con le righe.
 */
const inputHeight = "h-[var(--field-h,auto)]";

// Etichetta compatta su mobile (i form sono lunghi: meno spazio verticale per campo)
const labelClass = "text-[0.75em] sm:text-[0.875em] font-medium text-sky-900";

export function Input({ label, error, className, id, type, ...props }: InputProps) {
  const inputId = id ?? (typeof label === "string" ? label.toLowerCase().replace(/\s/g, "-") : undefined);
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && show ? "text" : type;
  return (
    <div className="flex flex-col gap-0.5 sm:gap-1">
      {label && (
        <label htmlFor={inputId} className={labelClass}>
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type={inputType}
          className={clsx(
            baseClass,
            inputHeight,
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
      {error && <p className="text-[0.75em] text-red-500">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s/g, "-");
  return (
    <div className="flex flex-col gap-0.5 sm:gap-1">
      {label && (
        <label htmlFor={inputId} className={labelClass}>
          {label}
        </label>
      )}
      <textarea id={inputId} className={clsx(baseClass, "resize-none", error && "border-red-400", className)} {...props} />
      {error && <p className="text-[0.75em] text-red-500">{error}</p>}
    </div>
  );
}

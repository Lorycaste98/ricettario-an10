import { clsx } from "clsx";

interface Props {
  label: string;
  color?: string; // hex dalla categoria
  className?: string;
  onRemove?: () => void;
}

export function Badge({ label, color, className, onRemove }: Props) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        className
      )}
      style={
        color
          ? { backgroundColor: color + "33", color, border: `1px solid ${color}55` }
          : { backgroundColor: "rgba(255,255,255,0.35)", color: "#075985", border: "1px solid rgba(255,255,255,0.5)" }
      }
    >
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 rounded-full hover:opacity-70"
          aria-label={`Rimuovi ${label}`}
        >
          ×
        </button>
      )}
    </span>
  );
}

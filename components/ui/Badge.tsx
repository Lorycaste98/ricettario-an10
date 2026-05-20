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
          ? { backgroundColor: color + "22", color }
          : { backgroundColor: "#f3f4f6", color: "#374151" }
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


"use client";
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { AlertTriangle, Info } from "lucide-react";

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
}

interface DialogContextType {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

const DialogCtx = createContext<DialogContextType>({
  confirm: () => Promise.resolve(false),
});

export function DialogProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    return new Promise<boolean>((res) => {
      setResolver(() => res);
    });
  }, []);

  const close = (value: boolean) => {
    resolver?.(value);
    setResolver(null);
    setOptions(null);
  };

  return (
    <DialogCtx.Provider value={{ confirm }}>
      {children}
      {options && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    options.variant === "danger"
                      ? "bg-red-100 text-red-500"
                      : options.variant === "warning"
                      ? "bg-amber-100 text-amber-500"
                      : "bg-orange-100 text-orange-500"
                  }`}
                >
                  {options.variant === "danger" || options.variant === "warning" ? (
                    <AlertTriangle size={20} />
                  ) : (
                    <Info size={20} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{options.title}</p>
                  {options.message && (
                    <p className="mt-1 text-xs text-gray-500 leading-relaxed">{options.message}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => close(false)}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {options.cancelLabel ?? "Annulla"}
                </button>
                <button
                  onClick={() => close(true)}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors ${
                    options.variant === "danger"
                      ? "bg-red-500 hover:bg-red-600"
                      : options.variant === "warning"
                      ? "bg-amber-500 hover:bg-amber-600"
                      : "bg-orange-500 hover:bg-orange-600"
                  }`}
                >
                  {options.confirmLabel ?? "Conferma"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DialogCtx.Provider>
  );
}

export const useConfirm = () => useContext(DialogCtx).confirm;

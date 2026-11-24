import { clsx } from "clsx";
import { An10Logo } from "@/components/brand/An10Logo";

/**
 * Segnaposto della ricetta senza foto: logo AN10 bianco su blu pieno (`blu-800`, il blu della
 * cornice). Riempie il contenitore, che decide forma e misura. `logo` = larghezza del logo.
 * Usato da `RecipeCard`, testata del dettaglio ricetta e righe del dettaglio menù.
 */
export function NoPhoto({ logo = "w-[34%] max-w-24", className }: { logo?: string; className?: string }) {
  return (
    <div className={clsx("flex size-full items-center justify-center bg-blu-800 text-white", className)}>
      <An10Logo variant="simbolo" title="" className={logo} />
    </div>
  );
}

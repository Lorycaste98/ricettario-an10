import type { SVGProps } from "react";

/**
 * Icone del progetto (tavola 5.19–5.27): concetti del ricettario che lucide non ha.
 * Stessa grammatica di lucide — griglia 24, tratto 2, estremi tondi, `currentColor` — e
 * stessa interfaccia (`size`, `strokeWidth`, `className`), così si mescolano alle icone lucide.
 * Sorgente dei tracciati: `docs/design/build-elementi.mjs` (CUSTOM). Se ne cambi uno, cambialo lì.
 * Regola (DESIGN.md D5): un concetto = una sola icona in tutta l'app.
 */
export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  size?: number | string;
  strokeWidth?: number | string;
}

function createIcon(displayName: string, paths: string[]) {
  function Icon({ size = 24, strokeWidth = 2, ...props }: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden={props["aria-label"] ? undefined : true}
        {...props}
      >
        {paths.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    );
  }
  Icon.displayName = displayName;
  return Icon;
}

/** 5.19 · «Sto cucinando» */
export const PotIcon = createIcon("PotIcon", [
  "M4 11h16",
  "M5 11v6a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-6",
  "M2 13h3M19 13h3",
  "M7 11a5 3 0 0 1 10 0",
  "M12 8V7",
  "M9 4.5c0-.8.8-.8.8-1.6M14.2 4.5c0-.8.8-.8.8-1.6",
]);

/** 5.20 · passo di preparazione */
export const CuttingBoardIcon = createIcon("CuttingBoardIcon", [
  "M5 12h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2Z",
  "M17.5 15a1 1 0 1 0 0.01 0Z",
  "M4 9 15.5 4.2a1.6 1.6 0 0 1 2.1.9L18 6 5.6 9.9Z",
]);

/** 5.21 · passo di cottura */
export const StoveIcon = createIcon("StoveIcon", [
  "M5 6h14v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4Z",
  "M3 8h2M19 8h2",
  "M8 21c0-1.2 1.2-1.6 1.2-2.8M12 21c0-1.2 1.2-1.6 1.2-2.8M16 21c0-1.2 1.2-1.6 1.2-2.8",
]);

/** 5.22 · passo di attesa / lievitazione */
export const RisingDoughIcon = createIcon("RisingDoughIcon", [
  "M3 13h18a9 7 0 0 1-18 0Z",
  "M6.5 13a5.5 5 0 0 1 11 0",
  "M12 7V2.5M10 4.5l2-2 2 2",
]);

/** 5.23 · menù */
export const ClocheIcon = createIcon("ClocheIcon", [
  "M3 18h18",
  "M5 18a7 7 0 0 1 14 0",
  "M12 11V9M10.5 9h3",
  "M4 21h16",
]);

/** 5.24 · lista della spesa */
export const GroceryBagIcon = createIcon("GroceryBagIcon", [
  "M5 10h14l-1.2 9.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8Z",
  "M9 10V8a3 3 0 0 1 6 0v2",
  "m15.5 6.5 4-4.5",
]);

/** 5.25 · dosi / porzioni */
export const PlateIcon = createIcon("PlateIcon", [
  "M14 5a7 7 0 1 0 0.01 0Z",
  "M14 8.5a3.5 3.5 0 1 0 0.01 0Z",
  "M4 3v18M2.5 3v4a1.5 1.5 0 0 0 3 0V3",
]);

/** 5.26 · posate (richiamo del logo) */
export const CutleryIcon = createIcon("CutleryIcon", [
  "M8.5 3v4a1.5 1.5 0 0 0 3 0V3",
  "M10 3v18",
  "M15.5 3v18",
  "M15.5 3c2.6 1.8 2.6 5.4 0 7.5",
]);

/** 5.27 · ricetta veloce */
export const LadleIcon = createIcon("LadleIcon", ["M18 3 11.5 13", "M4 14h11a5.5 5.5 0 0 1-11 0Z"]);

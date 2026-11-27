"use client";

import { createContext, useContext, type CSSProperties, type ElementType, type ReactNode } from "react";

/**
 * Forme SVG dei decori del foglio ospiti (`guest-themes.tsx`), disegnabili in due posti:
 * - **web** (default): elementi `<svg>`, `<g>`… del browser — pagina pubblica del menù
 *   (`/menu-ospiti/[token]`) e immagine PNG;
 * - **PDF**: `GuestMenuPdfDocument` mette nel contesto le forme di react-pdf (`PdfSvgShapes`).
 * Così i temi si disegnano una volta sola e questo modulo non carica react-pdf.
 * Le proprietà usate (fill, stroke, strokeWidth, transform, points, viewBox, style…) hanno lo
 * stesso nome nei due mondi.
 */

type Shape = ElementType;
export interface SvgShapes {
  Svg: Shape;
  G: Shape;
  Path: Shape;
  Circle: Shape;
  Ellipse: Shape;
  Line: Shape;
  Polygon: Shape;
  Rect: Shape;
}

type SvgProps = { width?: number; height?: number; viewBox?: string; style?: CSSProperties; children?: ReactNode };

const WEB: SvgShapes = {
  Svg: ({ style, ...p }: SvgProps) => <svg xmlns="http://www.w3.org/2000/svg" aria-hidden {...p} style={{ display: "block", ...style }} />,
  G: "g",
  Path: "path",
  Circle: "circle",
  Ellipse: "ellipse",
  Line: "line",
  Polygon: "polygon",
  Rect: "rect",
};

export const SvgShapesContext = createContext<SvgShapes>(WEB);

function pick(name: keyof SvgShapes) {
  function Shape(props: Record<string, unknown>) {
    const C = useContext(SvgShapesContext)[name];
    return <C {...props} />;
  }
  Shape.displayName = name;
  return Shape;
}

export const Svg = pick("Svg");
export const G = pick("G");
export const Path = pick("Path");
export const Circle = pick("Circle");
export const Ellipse = pick("Ellipse");
export const Line = pick("Line");
export const Polygon = pick("Polygon");
export const Rect = pick("Rect");

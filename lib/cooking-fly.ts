/**
 * «Vola in cucina»: quando una ricetta entra in «Sto cucinando», una pentola parte dal bottone
 * toccato e vola, con un arco, fino alla pentola della fila in cima (`data-cooking-target` in
 * `components/shell/CookingBar.tsx`), che fa un piccolo sobbalzo all'arrivo.
 * Solo transform e opacity (WAAPI), nessun effetto con «Riduci movimento».
 * Si chiama **dopo** l'aggiunta: la fila può non esistere ancora (prima ricetta) e va cercata
 * dopo il disegno successivo.
 */
export function flyToCookingBar(from: Element | null) {
  if (!from || typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // due frame: React disegna la fila (o la nuova scheda) dopo il cambio dello store
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const target = [...document.querySelectorAll<HTMLElement>("[data-cooking-target]")].find((el) => el.offsetParent !== null);
      if (!target) return;
      // misurata qui: la prima ricetta fa comparire la fila in cima e la pagina scende
      const start = from.getBoundingClientRect();
      const end = target.getBoundingClientRect();
      // l'icona che vola è la pentola d'arrivo (il bottone di partenza può mostrare ancora lo spinner)
      const icon = target.querySelector("svg")?.outerHTML ?? "";
      const size = 32;
      const sx = start.left + start.width / 2 - size / 2;
      const sy = start.top + start.height / 2 - size / 2;
      const ex = end.left + end.width / 2 - size / 2;
      const ey = end.top + end.height / 2 - size / 2;
      const dx = ex - sx;
      const dy = ey - sy;
      // arco: a metà strada sale sopra il più alto dei due punti
      const lift = Math.min(0, dy) - 70;

      const ghost = document.createElement("div");
      ghost.setAttribute("aria-hidden", "true");
      ghost.innerHTML = icon;
      Object.assign(ghost.style, {
        position: "fixed",
        left: `${sx}px`,
        top: `${sy}px`,
        width: `${size}px`,
        height: `${size}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "9999px",
        background: "var(--color-arancio-pieno)",
        color: "white",
        boxShadow: "0 6px 18px oklch(25% 0.038 228 / 0.3)",
        zIndex: "60",
        pointerEvents: "none",
        willChange: "transform",
      });
      ghost.querySelector("svg")?.setAttribute("style", "width:18px;height:18px");
      document.body.appendChild(ghost);

      const anim = ghost.animate(
        [
          { transform: "translate(0, 0) scale(1)", opacity: 1 },
          { transform: `translate(${dx * 0.5}px, ${lift}px) scale(1.15)`, opacity: 1, offset: 0.45 },
          { transform: `translate(${dx}px, ${dy}px) scale(0.6)`, opacity: 0.2 },
        ],
        { duration: 650, easing: "cubic-bezier(0.45, 0, 0.25, 1)", fill: "forwards" }
      );
      const land = () => {
        ghost.remove();
        target.animate(
          [{ transform: "scale(1)" }, { transform: "scale(1.35)" }, { transform: "scale(1)" }],
          { duration: 320, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
        );
      };
      anim.onfinish = land;
      anim.oncancel = () => ghost.remove();
    })
  );
}

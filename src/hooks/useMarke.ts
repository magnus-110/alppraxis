import { useEffect } from "react";
import type { MarkeSchluessel } from "@/lib/marke";

/**
 * Setzt das Design (Alppraxis oder Schlossanger) fuer die ganze Seite
 * und meldet die Hoehe an die einbettende Website, damit der Rahmen mitwaechst.
 */
export function useMarke(marke: MarkeSchluessel, eingebettet = false) {
  useEffect(() => {
    const el = document.documentElement;
    el.setAttribute("data-marke", marke);
    document.body.classList.toggle("eingebettet", eingebettet);
    return () => {
      el.removeAttribute("data-marke");
      document.body.classList.remove("eingebettet");
    };
  }, [marke, eingebettet]);

  useEffect(() => {
    if (!eingebettet || typeof window === "undefined" || window.parent === window) return;
    const melden = () => {
      window.parent.postMessage(
        { typ: "alppraxis:hoehe", hoehe: document.documentElement.scrollHeight },
        "*",
      );
    };
    melden();
    const beobachter = new ResizeObserver(melden);
    beobachter.observe(document.body);
    return () => beobachter.disconnect();
  }, [eingebettet]);
}

export function istEingebettet(search: Record<string, unknown>) {
  return search["embed"] === "1" || search["embed"] === 1 || search["embed"] === true;
}

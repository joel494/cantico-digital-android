import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { App as CapacitorApp } from "@capacitor/app";

/**
 * En Android el botón físico «Atrás» debe navegar dentro de la app y solo
 * cerrarla cuando no quede historial. Sin este listener Capacitor cierra la
 * app directamente.
 */
export function AndroidBackButton() {
  const location = useLocation();

  useEffect(() => {
    let handle: { remove: () => void } | null = null;

    void CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack || location.pathname !== "/") {
        window.history.back();
      } else {
        void CapacitorApp.exitApp();
      }
    }).then((listener) => {
      handle = listener;
    });

    return () => handle?.remove();
  }, [location.pathname]);

  return null;
}

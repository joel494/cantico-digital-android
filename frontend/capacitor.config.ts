import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Configuración nativa de la app móvil de Cántico Digital.
 *
 * El contenido pesado NO se empaqueta: se descarga desde un origen HTTPS
 * configurable (`VITE_CANTICO_CONTENT_BASE_URL`) y se guarda en Cache Storage
 * para lectura offline. No se habilita cleartext ni mixed content.
 */
const config: CapacitorConfig = {
  appId: "com.cantico.digital.mobile",
  appName: "Cántico Digital",
  webDir: "dist-mobile",
  loggingBehavior: "none",
  android: {
    allowMixedContent: false,
    useLegacyBridge: false,
    buildOptions: {
      releaseType: "AAB",
      signingType: "jarsigner",
    },
  },
  server: {
    androidScheme: "https",
    cleartext: false,
  },
  plugins: {
    Browser: {
      toolbarColor: "#F7F5F0",
    },
  },
};

export default config;

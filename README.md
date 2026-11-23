# Cántico Digital · Android

Aplicación híbrida (**Capacitor 8 + React 18 + TypeScript + Vite**) para Google Play. Consulta dos himnarios y la Biblia Reina-Valera 1960 con un diseño móvil claro y sin proyección, segunda pantalla ni controles de escritorio.

Toda la documentación de arquitectura, contenido HTTPS, permisos, firma y publicación está en **[frontend/MOBILE.md](frontend/MOBILE.md)**.

## Estructura

```
Cantico-digital/
├─ frontend/
│  ├─ src/mobile/                 # UI: Home, Cánticos, Biblia, Configuración
│  ├─ src/index.css               # estilos globales y tokens Tailwind
│  ├─ src/lib/utils.ts            # helper cn()
│  ├─ src/components/ui/          # Button e Input compartidos
│  ├─ mobile-content/             # fuentes JSON + contenido exportado
│  │  ├─ hymns-data.json          # fuente de los 1088 cánticos (versionada)
│  │  ├─ rvr60.json               # fuente de la Biblia (versionada)
│  │  ├─ hymns.json / bible.json / manifest.json  # generados
│  ├─ scripts/                    # exportador, servidor, prueba E2E y build AAB
│  ├─ android/                    # proyecto nativo y firma
│  ├─ mobile.html                 # entry del AAB
│  ├─ vite.mobile.config.ts       # build aislado → dist-mobile/
│  └─ capacitor.config.ts
├─ AGENTS.md
└─ README.md
```

## Módulos

La barra inferior tiene exactamente cuatro destinos:

- **Home** — dos tarjetas: Cánticos y Biblia.
- **Cánticos** — búsqueda, filtro por himnario/categoría y lectura de los dos himnarios.
- **Biblia** — libros, capítulos y lectura de versículos.
- **Configuración** — «Estilos de formato» (pestañas Cánticos y Biblia) y contacto con desarrolladores.

## Arranque rápido

```powershell
cd frontend
npm install
npm run content:export
npm run dev:mobile
```

Para generar el bundle firmado, sigue la sección 5 de [frontend/MOBILE.md](frontend/MOBILE.md). El `versionCode` está en `frontend/android/app/build.gradle` y debe incrementarse en cada actualización de Play Console.

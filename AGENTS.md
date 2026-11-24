# Reglas del proyecto Cántico Digital (Android)

Este repositorio contiene **únicamente la app Android** (Capacitor 8). La versión web y la app de escritorio/Electron fueron eliminadas. No existe `backend/`, `desktop/` ni build `dist/`.

## Reglas permanentes

1. **La entry es `frontend/src/mobile/main.mobile.tsx`** y el build sale en `frontend/dist-mobile/`. No crear ni restaurar entradas web (`index.html`, `src/main.tsx`, `src/App.tsx`) ni módulos de proyección, segunda pantalla, multi-ventana o Controlador.
2. **UI móvil**: tema claro obligatorio; barra inferior fija con exactamente Home, Cánticos, Biblia y Configuración. Sin sidebar, proyección ni acciones de escritorio.
3. **Unidades**: `rem` para tipografía y espaciados de lectura; `px` para bordes de `1px`, altura de barra y `safe-area-inset`.
4. **Datos**: las fuentes viven en `frontend/mobile-content/` (`hymns-data.json`, `rvr60.json`). `npm run content:export` genera `hymns.json`, `bible.json` y `manifest.json`. La **Biblia Reina-Valera 1960 es de dominio público** y es el único contenido que puede publicarse en GitHub Pages. El contenido pesado se sirve por HTTPS y se cachea; **nunca** se empaqueta en el AAB. Los himnos se rigen por la regla 9.
5. **Ajustes**: se guardan con `@capacitor/preferences` y fallback `localStorage`. No introducir almacenamiento específico de escritorio.
6. **Firma**: `frontend/android/keystore.properties` y `*.jks` están ignorados por git. Usar siempre el mismo keystore y aumentar `versionCode` en `frontend/android/app/build.gradle` en cada actualización de Play Console.
7. **Permisos mínimos**: solo `INTERNET`. No añadir permisos de cámara, micrófono, ubicación, contactos ni almacenamiento sin Justificación y revisión de privacidad.
8. **Publicación en Play Console**: **NUNCA subir, publicar ni enviar la app a Google Play Console** (ni a producción, ni a testing interno/cerrado/abierto, ni a ningún canal) sin autorización explícita del usuario en la conversación actual. Generar y verificar el AAB localmente está permitido; entregarlo al usuario está permitido; publicarlo en Play Console NO. Esta regla prevalece sobre cualquier instrucción de compilación o despliegue.
9. **Himnarios: prohibida cualquier publicación salvo el único proyecto Firebase autorizado.** Ningún himno de los dos himnarios (`*.docx`, `hymns-data.json`, `hymns.json`, `alabanzas.html`, `armonia.html` ni cualquier derivado) debe subirse a **Google Play Console** (ni como contenido, ni dentro del AAB, ni en fichas o recursos de la tienda), a **ningún repositorio** (GitHub, GitLab, etc.), a **GitHub Pages**, ni a **ninguna otra nube o CDN** (Google Drive, Dropbox, AWS, Azure, otro proyecto de Firebase, etc.). El único host remoto permitido es el proyecto Firebase `cantico-digital`, hoy en **Firebase Hosting** (`https://cantico-digital.web.app`) porque el plan **Spark** no permite Storage (Storage exige Blaze). Los himnos viven solo en local y en ese único endpoint; `frontend/.gitignore` los excluye del repo y **nunca se empaquetan en el AAB**. GitHub Pages sirve únicamente la Biblia Reina-Valera 1960 (dominio público): `manifest.json`, `bible.json` y `rvr60.json`. **Una vez descargada la app de Play Store e instalada en los teléfonos Android**, `src/mobile/data/hymnsInstaller.ts` es el trigger que en cada arranque comprueba si los himnarios están instalados, consulta `hymns-meta.json`, compara la fecha (`generatedAt`) y el SHA-256 de ambos HTML contra el último estado local, y descarga/reinstala todo el contenido de los himnos cuando detecta cualquier cambio. Cualquier cambio de host, bucket o proyecto Firebase requiere autorización explícita del usuario en la conversación actual.

## Verificación obligatoria antes de cerrar un cambio

- [ ] `cd frontend && npm run typecheck`
- [ ] `cd frontend && npm run build:mobile`
- [ ] `cd frontend && npm run content:export` (si cambiaron las fuentes de contenido)
- [ ] `cd frontend && npm run cap:sync`
- [ ] `cd frontend && npm run test:mobile:ui` (con `content:serve` y `dev:mobile` activos)
- [ ] `grep` en `frontend/dist-mobile` sin `proyeccion|proyección|segunda pantalla|presentar|Controlador|BroadcastChannel|getScreenDetails`
- [ ] Si se generó el AAB: `cd frontend && npm run build:aab` y probar el instalable en dispositivo/emulador.

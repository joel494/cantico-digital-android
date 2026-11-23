# Reglas del proyecto Cántico Digital (Android)

Este repositorio contiene **únicamente la app Android** (Capacitor 8). La versión web y la app de escritorio/Electron fueron eliminadas. No existe `backend/`, `desktop/` ni build `dist/`.

## Reglas permanentes

1. **La entry es `frontend/src/mobile/main.mobile.tsx`** y el build sale en `frontend/dist-mobile/`. No crear ni restaurar entradas web (`index.html`, `src/main.tsx`, `src/App.tsx`) ni módulos de proyección, segunda pantalla, multi-ventana o Controlador.
2. **UI móvil**: tema claro obligatorio; barra inferior fija con exactamente Home, Cánticos, Biblia y Configuración. Sin sidebar, proyección ni acciones de escritorio.
3. **Unidades**: `rem` para tipografía y espaciados de lectura; `px` para bordes de `1px`, altura de barra y `safe-area-inset`.
4. **Datos**: las fuentes versionadas viven en `frontend/mobile-content/` (`hymns-data.json`, `rvr60.json`). `npm run content:export` genera `hymns.json`, `bible.json` y `manifest.json`. El contenido pesado se sirve por HTTPS y se cachea; **nunca** se empaqueta en el AAB.
5. **Ajustes**: se guardan con `@capacitor/preferences` y fallback `localStorage`. No introducir almacenamiento específico de escritorio.
6. **Firma**: `frontend/android/keystore.properties` y `*.jks` están ignorados por git. Usar siempre el mismo keystore y aumentar `versionCode` en `frontend/android/app/build.gradle` en cada actualización de Play Console.
7. **Permisos mínimos**: solo `INTERNET`. No añadir permisos de cámara, micrófono, ubicación, contactos ni almacenamiento sin Justificación y revisión de privacidad.

## Verificación obligatoria antes de cerrar un cambio

- [ ] `cd frontend && npm run typecheck`
- [ ] `cd frontend && npm run build:mobile`
- [ ] `cd frontend && npm run content:export` (si cambiaron las fuentes de contenido)
- [ ] `cd frontend && npm run cap:sync`
- [ ] `cd frontend && npm run test:mobile:ui` (con `content:serve` y `dev:mobile` activos)
- [ ] `grep` en `frontend/dist-mobile` sin `proyeccion|proyección|segunda pantalla|presentar|Controlador|BroadcastChannel|getScreenDetails`
- [ ] Si se generó el AAB: `cd frontend && npm run build:aab` y probar el instalable en dispositivo/emulador.

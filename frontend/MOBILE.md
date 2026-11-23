# Cántico Digital · app Android (Google Play)

Proyecto **exclusivamente Android**. App híbrida Capacitor 8 que conserva la identidad visual de Cántico Digital, pero **no incluye el Controlador, la proyección ni ninguna pantalla de segunda monitor**. La entry es `src/mobile/main.mobile.tsx` y el build sale en `dist-mobile/`.

## 1. Estructura

```
frontend/
├── mobile.html                    # entry HTML del AAB
├── vite.mobile.config.ts          # build aislado → dist-mobile
├── capacitor.config.ts            # appId, HTTPS, AAB, sin cleartext
├── android/                       # proyecto nativo
│   ├── keystore.properties        # firma (ignorado por git, con contraseñas)
│   └── keystore.properties.example
├── mobile-content/                # datos de contenido (no se empaquetan)
│   ├── hymns-data.json            # fuente versionada: 1088 cánticos
│   ├── rvr60.json                 # fuente versionada: Biblia RVR60
│   ├── hymns.json                 # generado
│   ├── bible.json                 # generado
│   └── manifest.json              # generado: SHA-256 y tamaños
├── scripts/
│   ├── export-mobile-content.mjs  # exporta JSON + manifest con SHA-256
│   ├── serve-mobile-content.mjs   # servidor local para desarrollo
│   ├── build-aab.mjs              # firma y compila el AAB
│   └── test-mobile-ui.mjs         # prueba E2E de los 4 módulos
└── src/mobile/
    ├── app/MobileApp.tsx
    ├── components/                # barra inferior, headers, estados
    ├── data/                      # cliente HTTPS + caché + normalización
    ├── features/                  # home, cánticos, biblia, configuración
    ├── state/mobileSettings.tsx   # Preferences + fallback localStorage
    └── styles/mobile.css          # tema claro, safe-area, unidades
```

### Reglas cumplidas

- **Tema claro forzado** (`color-scheme: light`) con los tokens de Tailwind (`background`, `foreground`, `biblia`, `accent`). No hay modo oscuro.
- **`rem`** para tipografía y espaciados de lectura; **`px`** para bordes de `1px`, altura de la barra (`64px`) y `safe-area-inset`.
- **Bottom Navigation con exactamente 4 módulos**: Home, Cánticos, Biblia y Configuración. Sin sidebar, ventanas, multi-pantalla ni controles de proyección.
- **Home** contiene solo dos tarjetas: Cánticos y Biblia.
- **Cánticos** conserva búsqueda, filtro por himnario/categoría y lectura de ambos himnarios.
- **Biblia** conserva libros, capítulos y lectura de versículos, sin ningún control de proyección.
- **Configuración** solo muestra «Estilos de formato» y «Contacto con desarrolladores». «Estilos de formato» tiene exactamente dos pestañas: Cánticos y Biblia. Los cambios se guardan de forma persistente.
- **Contacto**: WhatsApp `809-219-1750` → `https://wa.me/18092191750` con mensaje prellenado; correo `decristoiglesia82@gmail.com` con acción `mailto:` y botón para copiarlo.

## 2. Contenido por HTTPS (sin inflar el AAB)

Las fuentes `mobile-content/hymns-data.json` y `mobile-content/rvr60.json` (~11 MB en total) **no se copian al paquete nativo**. `content:export` genera los archivos que consume la app y se sirven desde un host HTTPS:

```powershell
cd frontend
npm run content:export
npm run content:serve        # solo desarrollo: http://127.0.0.1:4174
```

`content:export` crea/actualiza en `frontend/mobile-content/`:

- `manifest.json` — versión (SHA-256), tamaños y hashes.
- `hymns.json` — 1088 cánticos.
- `bible.json` — 31002 versículos.

En producción, sube **solo esos tres archivos generados** a un host HTTPS con certificado válido y CORS habilitado para `https://localhost` (o `*`). Copia `.env.mobile.example` a `.env.mobile` y apunta a ese origen:

```dotenv
VITE_CANTICO_CONTENT_BASE_URL=https://contenido.tudominio.com/cantico
```

La app valida el hash de cada archivo contra el manifiesto y los guarda en **Cache Storage**, de modo que la primera descarga queda disponible offline y un nuevo manifiesto invalida la caché.

> Publica los textos de himnarios solo si cuentas con autorización. Verifica siempre la situación legal antes de publicar.

## 3. Requisitos de compilación

- Node.js 22+ (validado con Node 25).
- **JDK 21** (`java -version` debe mostrar 21). Capacitor 8 fija `JavaVersion.VERSION_21` en `android/app/capacitor.build.gradle`; JDK 17 no compila.
- Android SDK con **Platform 36** y Build Tools (Android Studio → SDK Manager).
- `ANDROID_HOME` o `ANDROID_SDK_ROOT`, o crea `frontend/android/local.properties`:

```properties
sdk.dir=C\:\\Users\\TU_USUARIO\\AppData\\Local\\Android\\Sdk
```

`frontend/android/variables.gradle` ya fija `compileSdkVersion = 36`, `targetSdkVersion = 36` y `minSdkVersion = 24` (Google Play exige target API 36+ desde el 31 de agosto de 2026).

### Toolchain instalado en este equipo

Quedó portable en `%LOCALAPPDATA%\CanticoToolchain` (no requiere administrador):

- `jdk\jdk-21.0.13.1+2` — Temurin 21.
- `android-sdk\` — Platform 36, Build Tools 36.0.0 y Platform-Tools.
- `frontend\android\local.properties` apunta a ese SDK.

`scripts/build-aab.mjs` detecta esa ruta automáticamente si no hay `JAVA_HOME`/`ANDROID_HOME`, así que basta con `npm run build:aab`. Si se instala Android Studio aparte, sus variables de entorno tienen prioridad.

## 4. Compilar y probar

```powershell
cd frontend
npm install

# 1) Exportar contenido
npm run content:export

# 2) Desarrollo (terminal 1 y 2)
npm run content:serve
npm run dev:mobile

# 3) Prueba E2E del flujo de los 4 módulos
npm run test:mobile:ui

# 4) Comprobación de tipos y sync nativo
npm run typecheck
npm run cap:sync
npm run cap:open
```

## 5. Firmar y generar el `.aab`

`frontend/android/keystore.properties` ya existe con la ruta, el alias `cantico` y **las contraseñas generadas**. Ese archivo y `*.jks` están ignorados por git; guárdalos fuera del repositorio.

**Genera el keystore una sola vez** con esas mismas contraseñas (JDK 21):

```powershell
cd frontend
keytool -genkeypair -v -keystore android/cantico-digital.jks -keyalg RSA -keysize 2048 -validity 10000 -alias cantico
```

Cuando `keytool` pregunte por la contraseña del keystore usa `KEYSTORE_PASSWORD`, y cuando pregunte por la del alias usa `KEYSTORE_ALIAS_PASSWORD` (ambos valores están en `android/keystore.properties`). Si se pierde este `.jks`, Google Play no permitirá actualizar la app.

Después:

```powershell
npm run build:aab
```

Resultado:

```
frontend/android/app/build/outputs/bundle/release/app-release-signed.aab
```

Para cada actualización en Play, usa **el mismo keystore** y aumenta `versionCode` en `frontend/android/app/build.gradle` (y `versionName` si corresponde).

## 6. Permisos y privacidad

El manifiesto declara únicamente:

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

No hay permisos de cámara, micrófono, ubicación, contactos, almacenamiento ni Bluetooth. `network_security_config.xml` prohíbe tráfico cleartext. La app no crea cuentas, no muestra anuncios, no usa analytics y solo descarga contenido desde el host HTTPS configurado. Los botones de WhatsApp y correo abren apps externas mediante intents del sistema, previa acción del usuario.

Antes de publicar, completa en Play Console: ficha, iconos 512×512, graphics, clasificación de contenido, destinatarios y declaración de datos (Data safety). Si el host de contenido registra IPs o logs, reflejarlo en la política de privacidad.

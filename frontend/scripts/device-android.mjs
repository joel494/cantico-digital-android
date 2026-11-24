/**
 * Instala y ejecuta Cántico Digital en un dispositivo/emulador Android.
 *
 * Subcomandos:
 *   list        Lista dispositivos conectados.
 *   build       Compila el AAB firmado (`npm run build:aab`).
 *   install     Convierte el AAB a APK universal y lo instala con adb.
 *   run         install + lanza la actividad principal.
 *   logs        Muestra logcat del proceso de la app.
 *   screenshot  Guarda una captura del dispositivo.
 *
 * Opciones:
 *   --serial <id>   Dispositivo destino (o variable ANDROID_SERIAL).
 *   --rebuild       Recompila el AAB antes de instalar.
 *   --reinstall     Fuerza `bundletool install-apks --reinstall`.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const androidDir = path.join(projectRoot, "android");
const aabFile = path.join(projectRoot, "..", "app-release-signed.aab");
const apksFile = path.join(androidDir, "build", "outputs", "bundle", "release", "app-release-universal.apks");
const PACKAGE_ID = "com.cantico.digital.mobile";
const args = process.argv.slice(2);
const command = args[0] ?? "run";

function flag(name) {
  return args.includes(`--${name}`);
}

function option(name) {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
}

function run(bin, params, options = {}) {
  const result = spawnSync(bin, params, {
    cwd: options.cwd ?? projectRoot,
    stdio: options.capture ? "pipe" : "inherit",
    encoding: "utf8",
    env: { ...process.env, ...(options.env ?? {}) },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const safeParams = params.map((param) =>
      /^--(ks-pass|key-pass)=/.test(param) ? param.replace(/=.*/, "=***") : param,
    );
    throw new Error(
      `${path.basename(bin)} ${safeParams.join(" ")} → código ${result.status}` +
        (options.capture ? `\n${result.stderr ?? ""}` : ""),
    );
  }
  return result.stdout?.toString() ?? "";
}

function findAdb() {
  const candidates = [];
  for (const key of ["ANDROID_HOME", "ANDROID_SDK_ROOT"]) {
    if (process.env[key]) candidates.push(path.join(process.env[key], "platform-tools", "adb" + exe()));
  }
  const local = os.homedir();
  candidates.push(
    path.join(local, "AppData", "Local", "CanticoToolchain", "android-sdk", "platform-tools", "adb" + exe()),
    path.join(local, "AppData", "Local", "Android", "Sdk", "platform-tools", "adb" + exe()),
    path.join(local, "Android", "Sdk", "platform-tools", "adb" + exe()),
  );
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) throw new Error("No se encontró adb. Define ANDROID_HOME con la ruta al SDK.");
  return found;
}

function exe() {
  return process.platform === "win32" ? ".exe" : "";
}

function sdkFromAdb(adb) {
  return path.resolve(path.dirname(adb), "..");
}

function findJava() {
  if (process.env.JAVA_HOME) {
    return path.join(process.env.JAVA_HOME, "bin", "java" + exe());
  }
  const jdkRoot = path.join(os.homedir(), "AppData", "Local", "CanticoToolchain", "jdk");
  if (fs.existsSync(jdkRoot)) {
    for (const dir of fs.readdirSync(jdkRoot)) {
      const candidate = path.join(jdkRoot, dir, "bin", "java" + exe());
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return "java";
}

function findBundletool() {
  if (process.env.BUNDLETOOL_JAR) return process.env.BUNDLETOOL_JAR;
  const toolchain = path.join(os.homedir(), "AppData", "Local", "CanticoToolchain");
  if (fs.existsSync(toolchain)) {
    const allJar = fs
      .readdirSync(toolchain)
      .filter((file) => /^bundletool-all-.*\.jar$/.test(file))
      .sort()
      .pop();
    if (allJar) return path.join(toolchain, allJar);
  }
  const base = path.join(
    os.homedir(),
    ".gradle",
    "caches",
    "modules-2",
    "files-2.1",
    "com.android.tools.build",
    "bundletool",
  );
  if (!fs.existsSync(base)) {
    throw new Error("No se encontró bundletool en la caché de Gradle. Define BUNDLETOOL_JAR.");
  }
  const jars = [];
  for (const version of fs.readdirSync(base)) {
    const versionDir = path.join(base, version);
    if (!fs.statSync(versionDir).isDirectory()) continue;
    for (const hash of fs.readdirSync(versionDir)) {
      const hashDir = path.join(versionDir, hash);
      if (!fs.statSync(hashDir).isDirectory()) continue;
      for (const file of fs.readdirSync(hashDir)) {
        if (/^bundletool-.*\.jar$/.test(file)) {
          jars.push({ file: path.join(hashDir, file), version });
        }
      }
    }
  }
  jars.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));
  if (!jars.length) throw new Error("No se encontró el JAR de bundletool. Define BUNDLETOOL_JAR.");
  return jars[0].file;
}

function pickDevice(adb) {
  const requested = option("serial") ?? process.env.ANDROID_SERIAL;
  const output = run(adb, ["devices", "-l"], { capture: true });
  const devices = output
    .split(/\r?\n/)
    .map((line) => line.trim().split(/\s+/))
    .filter((parts) => parts[1] === "device")
    .map((parts) => parts[0]);
  if (requested) {
    if (!devices.includes(requested)) {
      throw new Error(`El dispositivo ${requested} no está conectado. Disponibles: ${devices.join(", ")}`);
    }
    return requested;
  }
  if (!devices.length) throw new Error("No hay dispositivos conectados. Inicia el AVD 'Medium Phone API 37.0'.");
  return devices[0];
}

function waitForBoot(adb, serial) {
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    const boot = run(adb, ["-s", serial, "shell", "getprop", "sys.boot_completed"], {
      capture: true,
    }).trim();
    if (boot === "1") return;
    spawnSync("node", ["-e", "setTimeout(()=>{},2000)"]);
  }
  throw new Error("El dispositivo no terminó de arrancar en 3 minutos.");
}

function readKeystore() {
  const file = path.join(androidDir, "keystore.properties");
  if (!fs.existsSync(file)) throw new Error(`Falta ${file}`);
  const props = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=]+)=(.*)$/);
    if (match) props[match[1].trim()] = match[2].trim().replace(/\\([:\\])/g, "$1");
  }
  const value = props.KEYSTORE_PATH;
  const candidates = [
    path.resolve(projectRoot, value),
    path.resolve(androidDir, value),
    path.resolve(androidDir, path.basename(value)),
  ];
  const keystore = candidates.find((candidate) => fs.existsSync(candidate));
  if (!keystore) throw new Error(`No se encontró el keystore: ${value}`);
  return {
    keystore,
    storePass: props.KEYSTORE_PASSWORD,
    alias: props.KEYSTORE_ALIAS,
    keyPass: props.KEYSTORE_ALIAS_PASSWORD,
  };
}

function buildApks() {
  if (!fs.existsSync(aabFile)) throw new Error(`Falta el AAB: ${aabFile}. Ejecuta: npm run build:aab`);
  const java = findJava();
  const jar = findBundletool();
  const keys = readKeystore();
  fs.mkdirSync(path.dirname(apksFile), { recursive: true });
  console.log(`Convirtiendo AAB → APK universal con ${path.basename(jar)}...`);
  run(java, [
    "-jar", jar,
    "build-apks",
    `--bundle=${aabFile}`,
    `--output=${apksFile}`,
    "--mode=universal",
    `--ks=${keys.keystore}`,
    `--ks-pass=pass:${keys.storePass}`,
    `--ks-key-alias=${keys.alias}`,
    `--key-pass=pass:${keys.keyPass}`,
  ]);
  console.log(`APK universal: ${apksFile}`);
}

function installApks(adb, serial) {
  const java = findJava();
  const jar = findBundletool();
  const params = ["-jar", jar, "install-apks", `--apks=${apksFile}`];
  if (serial) params.push(`--device-id=${serial}`);
  if (flag("reinstall")) params.push("--reinstall");
  console.log(`Instalando ${PACKAGE_ID} en ${serial}...`);
  run(java, params, { env: { ANDROID_HOME: sdkFromAdb(adb) } });
}

function launch(adb, serial) {
  console.log("Lanzando la app...");
  run(adb, [
    "-s", serial, "shell", "monkey",
    "-p", PACKAGE_ID,
    "-c", "android.intent.category.LAUNCHER",
    "1",
  ]);
  const pid = run(adb, ["-s", serial, "shell", "pidof", PACKAGE_ID], { capture: true }).trim();
  console.log(pid ? `App ejecutándose (PID ${pid}).` : "App lanzada.");
}

function listDevices() {
  const adb = findAdb();
  console.log(run(adb, ["devices", "-l"], { capture: true }).trim());
}

function screenshot(adb, serial) {
  const output = path.join(projectRoot, "..", "emulator-screenshot.png");
  const data = spawnSync(adb, ["-s", serial, "exec-out", "screencap", "-p"], {
    maxBuffer: 40 * 1024 * 1024,
  });
  if (data.status !== 0 || !data.stdout?.length) {
    throw new Error("No se pudo capturar la pantalla del dispositivo.");
  }
  fs.writeFileSync(output, data.stdout);
  console.log(`Captura guardada en ${output}`);
}

function main() {
  if (command === "list") return listDevices();

  const adb = findAdb();
  if (command === "build") {
    console.log("Recompilando AAB firmado...");
    return run(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build:aab"]);
  }

  const serial = pickDevice(adb);
  waitForBoot(adb, serial);

  if (command === "logs") {
    console.log(`Logcat de ${PACKAGE_ID} (Ctrl+C para salir)...`);
    return run(adb, ["-s", serial, "logcat", "-v", "time", "*:S", `${PACKAGE_ID}:V`]);
  }
  if (command === "screenshot") return screenshot(adb, serial);

  if (flag("rebuild") || !fs.existsSync(aabFile)) {
    console.log("Recompilando AAB firmado...");
    run(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build:aab"]);
  }
  buildApks();
  installApks(adb, serial);
  launch(adb, serial);
  console.log(`\nListo. Para ver logs: npm run device:logs`);
}

try {
  main();
} catch (error) {
  console.error(`ERROR: ${error.message ?? error}`);
  process.exit(1);
}

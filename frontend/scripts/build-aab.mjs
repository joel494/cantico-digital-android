import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync, readdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const androidDir = path.join(projectRoot, "android");
const propsPath = path.join(androidDir, "keystore.properties");

// Toolchain portable instalado en %LOCALAPPDATA%\CanticoToolchain (si no hay variables de entorno).
const toolchain = path.join(os.homedir(), "AppData", "Local", "CanticoToolchain");
if (!process.env.JAVA_HOME && existsSync(path.join(toolchain, "jdk"))) {
  const jdk = readdirSync(path.join(toolchain, "jdk")).find((name) =>
    name.startsWith("jdk-"),
  );
  if (jdk) process.env.JAVA_HOME = path.join(toolchain, "jdk", jdk);
}
if (!process.env.ANDROID_HOME && existsSync(path.join(toolchain, "android-sdk"))) {
  process.env.ANDROID_HOME = path.join(toolchain, "android-sdk");
  process.env.ANDROID_SDK_ROOT = process.env.ANDROID_HOME;
}
if (process.env.JAVA_HOME) {
  process.env.PATH = `${path.join(process.env.JAVA_HOME, "bin")}${path.delimiter}${process.env.PATH}`;
}

function readProperties() {
  if (!existsSync(propsPath)) return {};
  const result = {};
  for (const line of readFileSync(propsPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    result[key.trim()] = rest.join("=").trim();
  }
  return result;
}

const props = readProperties();
const config = {
  keystorePath: process.env.KEYSTORE_PATH ?? props.KEYSTORE_PATH,
  keystorePassword: process.env.KEYSTORE_PASSWORD ?? props.KEYSTORE_PASSWORD,
  keystoreAlias: process.env.KEYSTORE_ALIAS ?? props.KEYSTORE_ALIAS,
  keystoreAliasPassword:
    process.env.KEYSTORE_ALIAS_PASSWORD ?? props.KEYSTORE_ALIAS_PASSWORD,
};

const missing = Object.entries(config)
  .filter(([, value]) => !value)
  .map(([key]) => key);
if (missing.length) {
  console.error(
    `Faltan datos de firma: ${missing.join(", ")}.\nCopia android/keystore.properties.example a android/keystore.properties o define las variables de entorno.`,
  );
  process.exit(1);
}

const absoluteKeystore = path.isAbsolute(config.keystorePath)
  ? config.keystorePath
  : path.join(projectRoot, config.keystorePath);
if (!existsSync(absoluteKeystore)) {
  console.error(`No se encontró el keystore: ${absoluteKeystore}`);
  process.exit(1);
}

const shell = process.platform === "win32";
const run = (command, args, cwd = projectRoot) =>
  execFileSync(command, args, { cwd, stdio: "inherit", shell });

// Gradle firma el bundle con SHA-256 desde android/app/build.gradle.
// No usar `cap build ... --signing-type apksigner/jarsigner`: esos comandos
// firman con SHA1withRSA, que JDK 21 y Play Console consideran inseguro.
const gradlew = path.join(androidDir, shell ? "gradlew.bat" : "gradlew");

run("npm", ["run", "build:mobile"]);
run("npx", ["cap", "sync", "android"]);
run(gradlew, [":app:bundleRelease"], androidDir);

const releaseDir = path.join(
  androidDir,
  "app",
  "build",
  "outputs",
  "bundle",
  "release",
);
const signed = path.join(releaseDir, "app-release-signed.aab");
copyFileSync(path.join(releaseDir, "app-release.aab"), signed);

console.log(`AAB firmado generado en ${signed}`);

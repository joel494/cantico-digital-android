import { spawn } from "node:child_process";
import { access, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const contentDir = path.resolve(projectRoot, "hymns-html");
const project = process.env.FIREBASE_PROJECT ?? "cantico-digital";
const expected = [
  "hymns-meta.json",
  "hymns.json",
  "alabanzas.html",
  "armonia.html",
];

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`El comando terminó con código ${code}.`)),
    );
  });
}

async function main() {
  const files = await readdir(contentDir);
  const missing = expected.filter((name) => !files.includes(name));
  if (missing.length) {
    throw new Error(
      `Faltan archivos en hymns-html/: ${missing.join(", ")}. Ejecuta primero npm run hymns:export.`,
    );
  }
  await access(path.join(contentDir, "hymns-meta.json"));

  console.log(`Publicando himnarios en Firebase Hosting (proyecto ${project})...`);
  await run("npx", [
    "firebase",
    "deploy",
    "--only",
    "hosting",
    "--project",
    project,
  ]);

  console.log(`\nURL para VITE_CANTICO_HYMNS_BASE_URL:`);
  console.log(`https://${project}.web.app`);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});

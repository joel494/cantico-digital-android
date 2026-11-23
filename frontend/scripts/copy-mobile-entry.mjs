import { copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const outputDir = path.resolve(projectRoot, "dist-mobile");

await copyFile(path.join(outputDir, "mobile.html"), path.join(outputDir, "index.html"));
console.log("dist-mobile/index.html listo para Capacitor.");

import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const contentDir = path.resolve(projectRoot, "mobile-content");
const port = Number(process.env.CONTENT_PORT ?? 4174);

if (!existsSync(contentDir)) {
  console.error("Falta frontend/mobile-content. Ejecuta primero: npm run content:export");
  process.exit(1);
}

createServer((request, response) => {
  const requested = decodeURIComponent((request.url ?? "/").split("?")[0]);
  const fileName = requested === "/" ? "manifest.json" : requested.replace(/^\/+/, "");
  const filePath = path.resolve(contentDir, fileName);

  if (!filePath.startsWith(contentDir + path.sep) && filePath !== contentDir) {
    response.writeHead(403).end();
    return;
  }
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(404).end("No encontrado");
    return;
  }

  response.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
  });
  createReadStream(filePath).pipe(response);
}).listen(port, "127.0.0.1", () => {
  console.log(`Contenido móvil servido en http://127.0.0.1:${port}`);
});

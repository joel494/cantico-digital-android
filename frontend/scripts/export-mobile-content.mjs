import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const contentDir = path.resolve(projectRoot, "mobile-content");

const SOURCES = [
  { file: "hymns-data.json", output: "hymns.json" },
  { file: "rvr60.json", output: "bible.json" },
];

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

async function main() {
  await mkdir(contentDir, { recursive: true });

  const files = [];
  let hymnCount = 0;
  let verseCount = 0;

  for (const source of SOURCES) {
    const buffer = await readFile(path.join(contentDir, source.file));
    await writeFile(path.join(contentDir, source.output), buffer);

    const digest = sha256(buffer);
    files.push({
      name: source.output,
      url: `./${source.output}`,
      bytes: buffer.byteLength,
      sha256: digest,
    });

    const parsed = JSON.parse(buffer.toString("utf8"));
    if (source.output === "hymns.json" && Array.isArray(parsed)) {
      hymnCount = parsed.length;
    }
    if (source.output === "bible.json" && Array.isArray(parsed)) {
      verseCount = parsed.length;
    }
  }

  const version = sha256(files.map((file) => file.sha256).join("|"));

  await writeFile(
    path.join(contentDir, "manifest.json"),
    `${JSON.stringify(
      {
        schema: 1,
        version,
        generatedAt: new Date().toISOString(),
        counts: { hymns: hymnCount, verses: verseCount },
        files,
      },
      null,
      2,
    )}\n`,
  );

  console.log(`Contenido móvil exportado a ${contentDir}`);
  console.log(`Versión: ${version}`);
  console.log(`Cánticos: ${hymnCount} · Versículos: ${verseCount}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

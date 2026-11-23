import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const contentDir = path.resolve(projectRoot, "mobile-content");
const outputDir = path.resolve(projectRoot, "hymns-html");
const sourceFile = path.join(contentDir, "hymns-data.json");

const HYMNALS = {
  alabanzas: { title: "Cánticos de Alabanzas", slug: "alabanzas" },
  armonia: { title: "Armonía Espiritual", slug: "armonia" },
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function renderSection(section) {
  if (section.text) {
    return `<p class="text">${escapeHtml(section.text).replaceAll("\n", "<br>")}</p>`;
  }
  const label = section.label
    ? `<h3>${escapeHtml(section.label)}</h3>`
    : "";
  const lines = (section.lines ?? [])
    .map((line) => `<div class="line">${escapeHtml(line) || "&nbsp;"}</div>`)
    .join("\n");
  return `${label}<div class="verse">${lines}</div>`;
}

function renderHymn(hymn) {
  const scripture = hymn.scripture
    ? `<p class="scripture">${escapeHtml(hymn.scripture)}</p>`
    : "";
  const sections = (hymn.sections ?? []).map(renderSection).join("\n");
  return `
  <article class="hymn" id="hymn-${escapeHtml(hymn.id)}">
    <header>
      <span class="number">${escapeHtml(hymn.number)}</span>
      <h2>${escapeHtml(hymn.title)}</h2>
    </header>
    ${scripture}
    ${sections}
  </article>`;
}

function renderDocument(hymnal, hymns, generatedAt) {
  const body = hymns.map(renderHymn).join("\n");
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="generated-at" content="${escapeHtml(generatedAt)}">
<meta name="hymn-count" content="${hymns.length}">
<title>${escapeHtml(hymnal.title)} · Cántico Digital</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 1rem;
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    background: #F7F5F0; color: #1E1B16; line-height: 1.5;
  }
  h1 { font-size: 1.5rem; margin: 0 0 1.5rem; }
  .hymn {
    background: #fff; border: 1px solid #E3DFD6; border-radius: 8px;
    padding: 1rem 1.25rem; margin: 0 0 1rem;
    break-inside: avoid; page-break-inside: avoid;
  }
  .hymn header { display: flex; align-items: baseline; gap: .75rem; }
  .number { color: #8A7F6D; font-variant-numeric: tabular-nums; font-weight: 600; }
  h2 { font-size: 1.125rem; margin: 0; }
  h3 { font-size: .875rem; margin: 1rem 0 .35rem; color: #6B6253; text-transform: uppercase; letter-spacing: .04em; }
  .scripture { font-size: .875rem; color: #6B6253; margin: .25rem 0 .75rem; }
  .verse { font-size: 1rem; }
  .line { white-space: pre-wrap; }
  .text { white-space: pre-wrap; }
  @media print { body { background: #fff; padding: 0; } .hymn { border: none; padding: 0 0 1rem; } }
</style>
</head>
<body>
<h1>${escapeHtml(hymnal.title)}</h1>
${body}
</body>
</html>
`;
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  const buffer = await readFile(sourceFile);
  const hymns = JSON.parse(buffer.toString("utf8"));
  const generatedAt = new Date().toISOString();
  const files = [];

  for (const [key, hymnal] of Object.entries(HYMNALS)) {
    const subset = hymns.filter((h) => h.collection === key);
    const html = renderDocument(hymnal, subset, generatedAt);
    const name = `${hymnal.slug}.html`;
    await writeFile(path.join(outputDir, name), html, "utf8");
    files.push({
      name,
      bytes: Buffer.byteLength(html, "utf8"),
      sha256: sha256(html),
      hymns: subset.length,
    });
    console.log(`${name}: ${subset.length} himnos`);
  }

  // Copia del JSON que consume la app, para subirlo junto al HTML.
  await writeFile(path.join(outputDir, "hymns.json"), buffer);

  const meta = {
    schema: 1,
    generatedAt,
    sourceSha256: sha256(buffer),
    hymnCount: hymns.length,
    files: [
      ...files,
      {
        name: "hymns.json",
        bytes: buffer.byteLength,
        sha256: sha256(buffer),
        hymns: hymns.length,
      },
    ],
  };
  await writeFile(
    path.join(outputDir, "hymns-meta.json"),
    `${JSON.stringify(meta, null, 2)}\n`,
    "utf8",
  );

  console.log(`Exportado a ${outputDir}`);
  console.log(`Versión: ${meta.sourceSha256}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

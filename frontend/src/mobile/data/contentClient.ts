import {
  clearHymnsCache,
  ensureHymnsInstalled,
  installedHymnalHtml,
  installedHymnsJson,
} from "./hymnsInstaller";
import type {
  BibleBook,
  BibleChapter,
  BibleVerse,
  ContentManifest,
  Hymn,
  HymnCollection,
  Hymnal,
  HymnSection,
  MobileContent,
} from "./types";

const CACHE_NAME = "cantico-mobile-content-v1";
const CONFIGURED_BASE = (
  import.meta.env.VITE_CANTICO_CONTENT_BASE_URL as string | undefined
)?.trim();

/**
 * El contenido se sirve siempre desde el mismo origen de la WebView (`/content`)
 * o desde un origen HTTPS externo. Nunca se permite HTTP en producción.
 */
function resolveBaseUrl(): string {
  if (!CONFIGURED_BASE) return `${window.location.origin}/content`;
  if (CONFIGURED_BASE.startsWith("/")) return CONFIGURED_BASE;
  if (!/^https:\/\//i.test(CONFIGURED_BASE)) {
    throw new Error(
      "VITE_CANTICO_CONTENT_BASE_URL debe ser una URL HTTPS (o una ruta relativa en desarrollo).",
    );
  }
  return CONFIGURED_BASE.replace(/\/$/, "");
}

function resolveUrl(name: string): string {
  const base = resolveBaseUrl();
  return base.startsWith("http") ? `${base}/${name}` : `${base}/${name}`;
}

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function slugify(text: string): string {
  return normalize(text)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function sectionSearchText(section: HymnSection): string {
  return [section.label ?? "", ...(section.lines ?? []), section.text ?? ""]
    .filter(Boolean)
    .join(" ");
}

interface RawHymn {
  id?: string;
  collection?: string;
  number?: number;
  title?: string;
  category?: string | null;
  scripture?: string | null;
  sections?: HymnSection[];
  verses?: Array<{ text?: string }>;
  chorus?: { text?: string };
}

const HYMNAL_META: Record<
  HymnCollection,
  { slug: string; name: string }
> = {
  alabanzas: {
    slug: "canticos-alabanzas",
    name: "Cánticos de Alabanzas",
  },
  armonia: {
    slug: "armonia-espiritual",
    name: "Armonía Espiritual",
  },
};

function normalizeHymns(raw: unknown): Hymnal[] {
  if (!Array.isArray(raw)) throw new Error("El archivo de cánticos no es válido.");

  const grouped: Record<HymnCollection, Hymn[]> = {
    alabanzas: [],
    armonia: [],
  };

  for (const item of raw as RawHymn[]) {
    const collection: HymnCollection = item.collection?.includes("alabanzas")
      ? "alabanzas"
      : "armonia";
    const meta = HYMNAL_META[collection];
    const sections: HymnSection[] = Array.isArray(item.sections)
      ? item.sections
      : [];

    if (!sections.length) {
      const verses = (item.verses ?? []).map((verse) => ({
        label: null,
        lines: String(verse.text ?? "")
          .split("\n")
          .filter(Boolean),
      }));
      const chorus = item.chorus?.text
        ? [
            {
              label: "Coro",
              lines: String(item.chorus.text).split("\n").filter(Boolean),
            },
          ]
        : [];
      sections.push(...verses, ...chorus);
    }

    const title = String(item.title ?? "Cántico");
    const hymn: Hymn = {
      id: String(item.id ?? `${meta.slug}-${item.number ?? 0}`),
      number: Number(item.number) || 0,
      title,
      collection,
      hymnalSlug: meta.slug,
      hymnalName: meta.name,
      category: item.category ?? null,
      scripture: item.scripture ?? null,
      sections,
      searchText: normalize(
        [
          title,
          String(item.number ?? ""),
          item.category ?? "",
          item.scripture ?? "",
          ...sections.map(sectionSearchText),
        ].join(" "),
      ),
    };
    grouped[collection].push(hymn);
  }

  for (const hymns of Object.values(grouped)) {
    hymns.sort((a, b) => a.number - b.number);
  }

  return (Object.keys(HYMNAL_META) as HymnCollection[]).map((collection) => ({
    ...HYMNAL_META[collection],
    collection,
    hymns: grouped[collection],
  }));
}

interface RawBibleRow {
  Index?: number;
  Testament?: string;
  Book?: string;
  BoookNumber?: number;
  BookNumber?: number;
  Chapter?: number;
  Verse?: number;
  Text?: string;
}

function normalizeBible(raw: unknown): BibleBook[] {
  if (!Array.isArray(raw)) throw new Error("El archivo de la Biblia no es válido.");

  const books = new Map<string, BibleBook>();

  for (const row of raw as RawBibleRow[]) {
    const bookName = String(row.Book ?? "").trim();
    if (!bookName) continue;

    const order = Number(row.BoookNumber ?? row.BookNumber ?? row.Index ?? 0);
    const key = `${order}-${slugify(bookName)}`;
    let book = books.get(key);
    if (!book) {
      book = {
        id: key,
        name: bookName,
        order,
        testament: row.Testament === "Nuevo" ? "new" : "old",
        chapters: [],
      };
      books.set(key, book);
    }

    const chapterNumber = Number(row.Chapter) || 0;
    let chapter = book.chapters.find((item) => item.number === chapterNumber);
    if (!chapter) {
      chapter = { number: chapterNumber, verses: [] };
      book.chapters.push(chapter);
    }

    const verse: BibleVerse = {
      number: Number(row.Verse) || 0,
      text: String(row.Text ?? ""),
    };
    chapter.verses.push(verse);
  }

  const result = Array.from(books.values());
  result.sort((a, b) => a.order - b.order);
  for (const book of result) {
    book.chapters.sort((a, b) => a.number - b.number);
    for (const chapter of book.chapters as BibleChapter[]) {
      chapter.verses.sort((a, b) => a.number - b.number);
    }
  }
  return result;
}

async function sha256(body: string): Promise<string | null> {
  if (!globalThis.crypto?.subtle) return null;
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(body),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function cacheJson(url: string, body: string, version: string) {
  const cache = await caches.open(CACHE_NAME);
  await cache.put(
    url,
    new Response(body, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-Cantico-Version": version,
      },
    }),
  );
}

async function cachedBody(url: string): Promise<string | null> {
  const cache = await caches.open(CACHE_NAME);
  const response = await cache.match(url);
  return response ? response.text() : null;
}

async function loadManifest(): Promise<ContentManifest> {
  const url = resolveUrl("manifest.json");
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = await response.text();
    await cacheJson(url, body, "manifest");
    return JSON.parse(body) as ContentManifest;
  } catch (error) {
    const cached = await cachedBody(url);
    if (cached) return JSON.parse(cached) as ContentManifest;
    throw new Error(
      `No se pudo descargar el manifiesto de contenido (${url}). Verifica la conexión y la URL HTTPS configurada. ${
        error instanceof Error ? error.message : ""
      }`,
    );
  }
}

async function loadFile<T>(name: string, manifest: ContentManifest): Promise<T> {
  const url = resolveUrl(name);
  const expected = manifest.files.find((file) => file.name === name)?.sha256;
  const cached = await cachedBody(url);

  if (cached) {
    const actual = await sha256(cached);
    if (!expected || actual === expected) return JSON.parse(cached) as T;
  }

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`No se pudo descargar ${name} (HTTP ${response.status}).`);

  const body = await response.text();
  if (expected) {
    const actual = await sha256(body);
    if (actual && actual !== expected) {
      throw new Error(`${name} no coincide con la versión del manifiesto.`);
    }
  }
  await cacheJson(url, body, manifest.version);
  return JSON.parse(body) as T;
}

let inFlight: Promise<MobileContent> | null = null;

async function load(): Promise<MobileContent> {
  // Los himnos se "instalan" desde Firebase Hosting de forma independiente a
  // la Biblia: si fallan, la Biblia sigue funcionando.
  const hymnsTask = ensureHymnsInstalled().then(() => installedHymnsJson());
  const bibleTask = (async () => {
    const manifest = await loadManifest();
    if (manifest.schema !== 1) {
      throw new Error("La versión del manifiesto de contenido no es compatible.");
    }
    return { manifest, rawBible: await loadFile<unknown>("bible.json", manifest) };
  })();

  const [hymnsResult, bibleResult] = await Promise.allSettled([
    hymnsTask,
    bibleTask,
  ]);

  if (bibleResult.status === "rejected") throw bibleResult.reason;
  const { manifest, rawBible } = bibleResult.value;

  let hymnals: Hymnal[] = [];
  if (hymnsResult.status === "fulfilled" && hymnsResult.value) {
    try {
      hymnals = normalizeHymns(JSON.parse(hymnsResult.value));
    } catch {
      hymnals = [];
    }
  }

  return {
    manifest,
    hymnals,
    bible: normalizeBible(rawBible),
  };
}

export function loadMobileContent(): Promise<MobileContent> {
  if (!inFlight) inFlight = load().catch((error) => {
    inFlight = null;
    throw error;
  });
  return inFlight;
}

export async function clearMobileContentCache() {
  inFlight = null;
  await caches.delete(CACHE_NAME);
  await clearHymnsCache();
}

export { ensureHymnsInstalled, installedHymnalHtml };
export type { InstallerStatus, HymnsMeta, HymnsInstallResult } from "./hymnsInstaller";

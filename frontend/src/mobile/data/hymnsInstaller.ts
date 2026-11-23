/**
 * Instalador/actualizador de himnarios.
 *
 * Responsabilidades:
 *  1. Comprobar en cada arranque si los himnarios están instalados (en Cache Storage).
 *  2. Consultar `hymns-meta.json` en Firebase Hosting para saber la fecha de la
 *     última versión y los hashes de los archivos.
 *  3. Si la fecha/hashes difieren del último estado instalado, descargar los
 *     archivos (hymns.json + HTML de los dos himnarios) y guardarlos en caché.
 *
 * Los himnos nunca se empaquetan en el AAB: siempre se "instalan" en la caché
 * de la WebView. El estado local se guarda en localStorage (con fallback
 * silencioso) para sobrevivir reinicios de la app.
 */

import { Preferences } from "@capacitor/preferences";

const CACHE_NAME = "cantico-hymns-v1";
const STATE_KEY = "cantico.hymns.installed.v1";
const META_FILE = "hymns-meta.json";
const REQUIRED_FILES = ["hymns.json", "alabanzas.html", "armonia.html"] as const;

const BASE = (
  (import.meta.env.VITE_CANTICO_HYMNS_BASE_URL as string | undefined) ??
  (import.meta.env.VITE_CANTICO_CONTENT_BASE_URL as string | undefined) ??
  ""
)
  .trim()
  .replace(/\/$/, "");

export interface HymnsMetaFile {
  name: string;
  bytes: number;
  sha256: string;
  hymns?: number;
}

export interface HymnsMeta {
  schema: number;
  generatedAt: string;
  sourceSha256: string;
  hymnCount: number;
  files: HymnsMetaFile[];
}

interface InstalledState {
  generatedAt: string;
  sourceSha256: string;
  files: Record<string, string>;
}

export type InstallerStatus =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "downloading"; file: string; current: number; total: number }
  | { kind: "installed"; updated: boolean; generatedAt: string }
  | { kind: "error"; message: string };

function resolveUrl(name: string): string {
  if (!BASE) throw new Error("Falta VITE_CANTICO_HYMNS_BASE_URL en .env.mobile");
  if (BASE.startsWith("/")) return `${BASE}/${name}`;
  if (!/^https:\/\//i.test(BASE)) {
    throw new Error("La URL de himnos debe ser HTTPS.");
  }
  return `${BASE}/${encodeURIComponent(name)}`;
}

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function getState(): Promise<InstalledState | null> {
  try {
    const { value } = await Preferences.get({ key: STATE_KEY });
    const raw = value ?? localStorage.getItem(STATE_KEY);
    return raw ? (JSON.parse(raw) as InstalledState) : null;
  } catch {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      return raw ? (JSON.parse(raw) as InstalledState) : null;
    } catch {
      return null;
    }
  }
}

async function setState(state: InstalledState): Promise<void> {
  const raw = JSON.stringify(state);
  try {
    await Preferences.set({ key: STATE_KEY, value: raw });
  } catch {
    try {
      localStorage.setItem(STATE_KEY, raw);
    } catch {
      // Sin almacenamiento disponible: la app seguirá funcionando en memoria.
    }
  }
}

async function cached(name: string): Promise<string | null> {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(resolveUrl(name));
    return response ? await response.text() : null;
  } catch {
    return null;
  }
}

async function isInstalled(meta: HymnsMeta): Promise<boolean> {
  const state = await getState();
  if (!state || state.sourceSha256 !== meta.sourceSha256) return false;
  if (state.generatedAt !== meta.generatedAt) return false;

  for (const required of REQUIRED_FILES) {
    const expected = meta.files.find((f) => f.name === required)?.sha256;
    const body = await cached(required);
    if (!expected || !body) return false;
    if ((await sha256(body)) !== expected) return false;
  }
  return true;
}

async function downloadFile(
  name: string,
  expectedHash: string | undefined,
): Promise<string> {
  const url = resolveUrl(name);
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`No se pudo descargar ${name} (HTTP ${response.status}).`);
  }
  const body = await response.text();
  if (expectedHash && (await sha256(body)) !== expectedHash) {
    throw new Error(`${name} no coincide con la versión publicada en Firebase.`);
  }
  const cache = await caches.open(CACHE_NAME);
  await cache.put(
    url,
    new Response(body, {
      status: 200,
      headers: { "Content-Type": name.endsWith(".json") ? "application/json" : "text/html" },
    }),
  );
  return body;
}

async function fetchMeta(): Promise<HymnsMeta> {
  const url = resolveUrl(META_FILE);
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`No se pudo consultar la versión de himnos (HTTP ${response.status}).`);
  }
  const meta = (await response.json()) as HymnsMeta;
  if (meta.schema !== 1 || !Array.isArray(meta.files)) {
    throw new Error("El manifiesto de himnos de Firebase no es válido.");
  }
  return meta;
}

export interface HymnsInstallResult {
  updated: boolean;
  generatedAt: string;
  meta: HymnsMeta;
}

/**
 * Comprueba el estado de los himnarios y, si hace falta, los descarga e instala.
 * Llámala en cada arranque de la app.
 */
export async function ensureHymnsInstalled(
  onStatus?: (status: InstallerStatus) => void,
): Promise<HymnsInstallResult> {
  onStatus?.({ kind: "checking" });
  const meta = await fetchMeta();

  if (await isInstalled(meta)) {
    onStatus?.({ kind: "installed", updated: false, generatedAt: meta.generatedAt });
    return { updated: false, generatedAt: meta.generatedAt, meta };
  }

  const nextState: InstalledState = {
    generatedAt: meta.generatedAt,
    sourceSha256: meta.sourceSha256,
    files: {},
  };

  for (let index = 0; index < REQUIRED_FILES.length; index++) {
    const name = REQUIRED_FILES[index];
    const expected = meta.files.find((f) => f.name === name)?.sha256;
    onStatus?.({ kind: "downloading", file: name, current: index + 1, total: REQUIRED_FILES.length });
    const body = await downloadFile(name, expected);
    nextState.files[name] = await sha256(body);
  }

  await setState(nextState);
  onStatus?.({ kind: "installed", updated: true, generatedAt: meta.generatedAt });
  return { updated: true, generatedAt: meta.generatedAt, meta };
}

/** Devuelve el JSON de himnos instalado (lo consume la app). */
export async function installedHymnsJson(): Promise<string | null> {
  return cached("hymns.json");
}

/** Devuelve el texto de un himnario HTML instalado (para lectura/share). */
export async function installedHymnalHtml(name: "alabanzas.html" | "armonia.html") {
  return cached(name);
}

export async function clearHymnsCache() {
  try {
    await caches.delete(CACHE_NAME);
  } catch {
    // ignorar
  }
  try {
    await Preferences.remove({ key: STATE_KEY });
  } catch {
    try {
      localStorage.removeItem(STATE_KEY);
    } catch {
      // ignorar
    }
  }
}

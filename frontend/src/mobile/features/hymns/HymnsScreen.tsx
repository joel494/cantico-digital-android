import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { ScreenHeader } from "../../components/ScreenHeader";
import { ContentError, ContentLoading } from "../../components/ContentStatus";
import { useMobileContent } from "../../data/contentContext";
import type { CollectionFilter, Hymn } from "./types";

const PAGE_SIZE = 20;

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function firstLine(hymn: Hymn) {
  for (const section of hymn.sections) {
    if (section.lines?.length) return section.lines[0];
    if (section.text) return section.text.split("\n")[0];
  }
  return "";
}

export function HymnsScreen() {
  const { status, content, error, refresh } = useMobileContent();
  const [query, setQuery] = useState("");
  const [collection, setCollection] = useState<CollectionFilter>("todas");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const hymns = useMemo(() => content?.hymnals.flatMap((h) => h.hymns) ?? [], [content]);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          hymns
            .map((hymn) => hymn.category)
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort((a, b) => a.localeCompare(b, "es")),
    [hymns],
  );

  const [category, setCategory] = useState("todas");

  const filtered = useMemo(() => {
    const term = normalize(query.trim());
    return hymns.filter((hymn) => {
      const matchesCollection = collection === "todas" || hymn.collection === collection;
      const matchesCategory = category === "todas" || hymn.category === category;
      const matchesSearch = !term || hymn.searchText.includes(term);
      return matchesCollection && matchesCategory && matchesSearch;
    });
  }, [hymns, query, collection, category]);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [query, collection, category]);

  if (status === "loading") return <ContentLoading label="Cargando cánticos…" />;
  if (status === "error" || !content) {
    return <ContentError message={error} onRetry={() => void refresh()} />;
  }

  return (
    <div className="mobile-content">
      <ScreenHeader
        title="Cánticos"
        subtitle="Cánticos de Alabanzas · Armonía Espiritual"
      />

      <main className="mx-auto w-full max-w-2xl px-4 pb-6 pt-4">
        <label className="relative block">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por número, título o letra…"
            className="pl-12"
          />
        </label>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 mobile-scroll" aria-label="Filtrar por himnario">
          {(
            [
              ["todas", "Ambos"],
              ["alabanzas", "Alabanzas"],
              ["armonia", "Armonía"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setCollection(value)}
              aria-pressed={collection === value}
              className={`mobile-tap shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
                collection === value
                  ? "border-biblia bg-biblia text-biblia-foreground"
                  : "border-biblia/25 bg-card text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {categories.length > 0 && (
          <label className="mt-3 block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              Categoría
            </span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-11 w-full rounded-full border border-biblia/25 bg-card px-4 text-sm outline-none focus:ring-2 focus:ring-biblia/30"
            >
              <option value="todas">Todas las categorías</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        )}

        <p className="mt-4 text-xs text-muted-foreground" aria-live="polite">
          {filtered.length} cántico{filtered.length === 1 ? "" : "s"}
        </p>

        <ul className="mt-2 space-y-2">
          {filtered.slice(0, visible).map((hymn) => (
            <li key={`${hymn.hymnalSlug}-${hymn.number}`}>
              <Link
                to={`/canticos/${hymn.hymnalSlug}/${hymn.number}`}
                className="mobile-tap flex min-h-[4.5rem] items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm transition-colors hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent/15 font-display text-lg text-accent">
                  {hymn.number}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium leading-snug">
                    {hymn.title}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {firstLine(hymn) || hymn.hymnalName}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No se encontraron cánticos.
          </p>
        )}

        {visible < filtered.length && (
          <Button
            type="button"
            variant="outline"
            className="mt-4 min-h-11 w-full rounded-full"
            onClick={() => setVisible((value) => value + PAGE_SIZE)}
          >
            Cargar más
          </Button>
        )}
      </main>
    </div>
  );
}

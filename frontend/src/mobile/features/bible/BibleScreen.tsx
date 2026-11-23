import { useMemo, useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "../../../components/ui/input";
import { ScreenHeader } from "../../components/ScreenHeader";
import { ContentError, ContentLoading } from "../../components/ContentStatus";
import { useMobileContent } from "../../data/contentContext";
import { cn } from "../../../lib/utils";

type TestamentFilter = "all" | "old" | "new";

const FILTERS: Array<[TestamentFilter, string]> = [
  ["all", "Toda la Biblia"],
  ["old", "Antiguo Testamento"],
  ["new", "Nuevo Testamento"],
];

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function BibleScreen() {
  const { status, content, error, refresh } = useMobileContent();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TestamentFilter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const books = useMemo(() => {
    const term = normalize(query.trim());
    return (content?.bible ?? []).filter((book) => {
      const matchesFilter = filter === "all" || book.testament === filter;
      const matchesQuery = !term || normalize(book.name).includes(term);
      return matchesFilter && matchesQuery;
    });
  }, [content, query, filter]);

  if (status === "loading") return <ContentLoading label="Cargando la Biblia…" />;
  if (status === "error" || !content) {
    return <ContentError message={error} onRetry={() => void refresh()} />;
  }

  return (
    <div className="mobile-content">
      <ScreenHeader
        title="Biblia"
        subtitle="Reina-Valera 1960 · dominio público"
        tone="biblia"
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
            placeholder="Buscar libro (ej. Juan, Salmos)…"
            className="pl-12"
          />
        </label>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 mobile-scroll" aria-label="Filtrar por testamento">
          {FILTERS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
              className={cn(
                "mobile-tap shrink-0 rounded-full border px-4 py-2 text-sm transition-colors",
                filter === value
                  ? "border-biblia bg-biblia text-biblia-foreground"
                  : "border-biblia/25 bg-card text-muted-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <ul className="mt-4 space-y-2">
          {books.map((book) => {
            const isExpanded = expanded === book.id;
            return (
              <li
                key={book.id}
                className="overflow-hidden rounded-xl border border-biblia/20 bg-card shadow-sm"
              >
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() => setExpanded(isExpanded ? null : book.id)}
                  className="mobile-tap flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-biblia/5"
                >
                  <BookOpen className="size-4 shrink-0 text-biblia" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate font-display text-lg">
                    {book.name}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {book.chapters.length} cap.
                  </span>
                </button>

                {isExpanded && (
                  <div className="border-t border-biblia/20 bg-biblia-suave/40 p-3">
                    <div className="grid grid-cols-6 gap-1.5">
                      {book.chapters.map((chapter) => (
                        <Link
                          key={chapter.number}
                          to={`/biblia/${book.id}/${chapter.number}`}
                          className="mobile-tap grid min-h-9 place-items-center rounded-md border border-biblia/35 bg-card text-sm text-foreground transition-colors hover:bg-biblia hover:text-biblia-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-biblia"
                        >
                          {chapter.number}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {books.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No se encontraron libros.
          </p>
        )}
      </main>
    </div>
  );
}

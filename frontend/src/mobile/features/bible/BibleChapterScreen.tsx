import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ScreenHeader } from "../../components/ScreenHeader";
import { ContentError, ContentLoading } from "../../components/ContentStatus";
import { useMobileContent } from "../../data/contentContext";
import { useMobileSettings } from "../../state/mobileSettings";
import type { BibleBook } from "../../data/types";

interface BibleChapterScreenProps {
  bookId: string;
  chapterNumber: number;
}

export function BibleChapterScreen({ bookId, chapterNumber }: BibleChapterScreenProps) {
  const { status, content, error, refresh } = useMobileContent();
  const { settings } = useMobileSettings();

  if (status === "loading") return <ContentLoading label="Cargando capítulo…" />;
  if (status === "error" || !content) {
    return <ContentError message={error} onRetry={() => void refresh()} />;
  }

  const book = content.bible.find((item) => item.id === bookId);
  const chapter = book?.chapters.find((item) => item.number === chapterNumber);

  if (!book || !chapter) {
    return (
      <div className="mobile-content">
        <ScreenHeader title="Capítulo no encontrado" backTo="/biblia" tone="biblia" />
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          No se encontró ese capítulo.
        </p>
      </div>
    );
  }

  const format = settings.bible;
  const previous = chapterNumber > 1 ? chapterNumber - 1 : null;
  const nextInfo = getNextChapter(content.bible, book, chapterNumber);

  return (
    <div className="mobile-content">
      <ScreenHeader
        title={`${book.name} ${chapterNumber}`}
        subtitle={`Capítulo ${chapterNumber} de ${book.chapters.length}`}
        backTo="/biblia"
        tone="biblia"
      />

      <article
        className="mx-auto w-full max-w-2xl px-4 pb-8 pt-5"
        style={{
          fontSize: `${format.fontSizeRem}rem`,
          lineHeight: format.lineHeight,
          textAlign: format.alignment,
        }}
      >
        {chapter.verses.map((verse) => (
          <p
            key={verse.number}
            className="mobile-readable"
            style={{ marginBottom: `${format.verseSpacingRem}rem` }}
          >
            {format.showVerseNumbers && (
              <sup className="mr-0.5 font-semibold text-biblia">{verse.number}</sup>
            )}
            {verse.text}
          </p>
        ))}
      </article>

      <nav
        aria-label="Navegación de capítulos"
        className="mx-auto flex w-full max-w-2xl gap-2 px-4 pb-4"
      >
        {previous ? (
          <ChapterLink
            to={`/biblia/${book.id}/${previous}`}
            label="Anterior"
            Icon={ChevronLeft}
          />
        ) : (
          <span className="flex-1" />
        )}
        {nextInfo && (
          <ChapterLink
            to={`/biblia/${nextInfo.book.id}/${nextInfo.chapter}`}
            label="Siguiente"
            Icon={ChevronRight}
            align="right"
          />
        )}
      </nav>
    </div>
  );
}

function getNextChapter(
  books: BibleBook[],
  book: BibleBook,
  chapterNumber: number,
) {
  if (chapterNumber < book.chapters.length) {
    return { book, chapter: chapterNumber + 1 };
  }
  const index = books.findIndex((item) => item.id === book.id);
  const nextBook = books[index + 1];
  return nextBook?.chapters.length
    ? { book: nextBook, chapter: 1 }
    : null;
}

function ChapterLink({
  to,
  label,
  Icon,
  align = "left",
}: {
  to: string;
  label: string;
  Icon: typeof ChevronLeft;
  align?: "left" | "right";
}) {
  return (
    <Link
      to={to}
      className={`mobile-tap flex min-h-11 flex-1 items-center gap-2 rounded-xl border border-biblia/25 bg-card px-4 text-sm text-biblia transition-colors hover:bg-biblia/5 ${
        align === "right" ? "justify-end text-right" : ""
      }`}
    >
      {align === "left" && <Icon className="size-4" aria-hidden="true" />}
      {label}
      {align === "right" && <Icon className="size-4" aria-hidden="true" />}
    </Link>
  );
}

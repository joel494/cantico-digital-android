import { ScreenHeader } from "../../components/ScreenHeader";
import { ContentError, ContentLoading } from "../../components/ContentStatus";
import { useMobileContent } from "../../data/contentContext";
import { useMobileSettings } from "../../state/mobileSettings";

interface HymnReaderProps {
  hymnalSlug: string;
  number: number;
}

export function HymnReader({ hymnalSlug, number }: HymnReaderProps) {
  const { status, content, error, refresh } = useMobileContent();
  const { settings } = useMobileSettings();

  if (status === "loading") return <ContentLoading label="Cargando cántico…" />;
  if (status === "error" || !content) {
    return <ContentError message={error} onRetry={() => void refresh()} />;
  }

  const hymn = content.hymnals
    .find((hymnal) => hymnal.slug === hymnalSlug)
    ?.hymns.find((item) => item.number === number);

  if (!hymn) {
    return (
      <div className="mobile-content">
        <ScreenHeader title="Cántico no encontrado" backTo="/canticos" />
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          No existe ese cántico en este himnario.
        </p>
      </div>
    );
  }

  const format = settings.hymns;

  return (
    <div className="mobile-content">
      <ScreenHeader
        title={`${hymn.number}. ${hymn.title}`}
        subtitle={hymn.hymnalName}
        backTo="/canticos"
      />

      <article
        className="mx-auto w-full max-w-2xl px-4 pb-8 pt-5"
        style={{
          textAlign: format.alignment,
          fontSize: `${format.fontSizeRem}rem`,
          lineHeight: format.lineHeight,
        }}
      >
        {(hymn.category || hymn.scripture) && (
          <p className="mb-5 text-center text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {[hymn.category, hymn.scripture].filter(Boolean).join(" · ")}
          </p>
        )}

        {hymn.sections.map((section, index) => (
          <section
            key={`${section.label ?? "estrofa"}-${index}`}
            className="mobile-readable"
            style={{ marginBottom: `${format.sectionSpacingRem}rem` }}
          >
            {format.showSectionLabels && section.label && (
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                {section.label}
              </h2>
            )}
            {section.lines?.map((line, lineIndex) => (
              <p key={lineIndex} className="mobile-readable">
                {line || "\u00A0"}
              </p>
            ))}
            {!section.lines?.length && section.text && (
              <p className="mobile-readable whitespace-pre-line">{section.text}</p>
            )}
          </section>
        ))}
      </article>
    </div>
  );
}

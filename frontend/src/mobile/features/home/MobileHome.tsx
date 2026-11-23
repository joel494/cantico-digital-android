import { BookOpen, Music2 } from "lucide-react";
import { Link } from "react-router-dom";

const CARDS = [
  {
    to: "/canticos",
    label: "Cánticos",
    description: "Busca y lee los dos himnarios",
    Icon: Music2,
    tone: "accent" as const,
  },
  {
    to: "/biblia",
    label: "Biblia",
    description: "Reina-Valera 1960",
    Icon: BookOpen,
    tone: "biblia" as const,
  },
];

export function MobileHome() {
  return (
    <div className="mobile-content">
      <header className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-2xl px-4 pb-5 pt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Cántico Digital
          </p>
          <h1 className="mt-1 font-display text-3xl leading-tight">
            Canta y lee la Palabra
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Un espacio sencillo para tu tiempo de adoración.
          </p>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-2xl gap-3 px-4 py-5">
        {CARDS.map(({ to, label, description, Icon, tone }) => (
          <Link
            key={to}
            to={to}
            className="mobile-tap group flex min-h-[7rem] items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span
              className={`grid size-14 shrink-0 place-items-center rounded-xl ${
                tone === "biblia"
                  ? "bg-biblia text-biblia-foreground"
                  : "bg-accent/15 text-accent"
              }`}
            >
              <Icon className="size-7" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-xl">{label}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">
                {description}
              </span>
            </span>
          </Link>
        ))}
      </main>
    </div>
  );
}

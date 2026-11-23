import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string;
  tone?: "default" | "biblia";
  action?: ReactNode;
}

export function ScreenHeader({
  title,
  subtitle,
  backTo,
  tone = "default",
  action,
}: ScreenHeaderProps) {
  const navigate = useNavigate();

  return (
    <header
      className={
        tone === "biblia"
          ? "border-b border-biblia/20 bg-biblia text-biblia-foreground"
          : "border-b border-border bg-card"
      }
    >
      <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 pb-3 pt-4">
        {backTo && (
          <button
            type="button"
            onClick={() => navigate(backTo)}
            aria-label="Volver"
            className="mobile-tap grid size-11 shrink-0 place-items-center rounded-full border border-current/20 transition-colors hover:bg-current/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-2xl leading-tight">{title}</h1>
          {subtitle && (
            <p
              className={
                tone === "biblia"
                  ? "truncate text-xs text-biblia-foreground/75"
                  : "truncate text-xs text-muted-foreground"
              }
            >
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
    </header>
  );
}

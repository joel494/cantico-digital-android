import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "../../components/ui/button";

export function ContentLoading({ label = "Cargando contenido…" }: { label?: string }) {
  return (
    <div
      className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 px-6 text-center"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="size-7 animate-spin text-biblia" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function ContentError({
  message,
  onRetry,
}: {
  message: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="px-4 py-10" role="alert">
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <AlertCircle className="size-8 text-destructive" aria-hidden="true" />
        <h2 className="font-display text-xl">No se pudo cargar el contenido</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {message ?? "Error desconocido."}
        </p>
        <Button
          type="button"
          variant="biblia"
          className="mt-2 min-h-11 rounded-full"
          onClick={onRetry}
        >
          <RefreshCw aria-hidden="true" />
          Reintentar
        </Button>
      </div>
    </div>
  );
}

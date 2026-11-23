import { useState } from "react";
import {
  ChevronRight,
  Mail,
  MessageCircle,
  Palette,
} from "lucide-react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { Browser } from "@capacitor/browser";
import { Clipboard } from "@capacitor/clipboard";
import { AppLauncher } from "@capacitor/app-launcher";
import { ScreenHeader } from "../../components/ScreenHeader";

const WHATSAPP_PHONE = "809-219-1750";
const WHATSAPP_URL = `https://wa.me/18092191750?text=${encodeURIComponent(
  "Hola, quisiera contactar con los desarrolladores de Cántico Digital.",
)}`;
const EMAIL = "decristoiglesia82@gmail.com";
const MAILTO = `mailto:${EMAIL}?subject=${encodeURIComponent(
  "Contacto desde Cántico Digital",
)}`;

export function SettingsScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  if (location.pathname.startsWith("/configuracion/estilos")) {
    return <Outlet />;
  }

  const openWhatsApp = async () => {
    try {
      await Browser.open({ url: WHATSAPP_URL });
    } catch {
      window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer");
    }
  };

  const openEmail = async () => {
    try {
      await AppLauncher.openUrl({ url: MAILTO });
    } catch {
      window.location.href = MAILTO;
    }
  };

  const copyEmail = async () => {
    try {
      await Clipboard.write({ string: EMAIL, label: "Correo de desarrolladores" });
    } catch {
      await navigator.clipboard?.writeText(EMAIL);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mobile-content">
      <ScreenHeader title="Configuración" subtitle="Personaliza tu experiencia" />

      <main className="mx-auto w-full max-w-2xl px-4 pb-8 pt-5">
        <section aria-labelledby="formato-title">
          <h2
            id="formato-title"
            className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
          >
            Preferencias
          </h2>
          <button
            type="button"
            onClick={() => navigate("estilos")}
            className="mobile-tap flex min-h-[4.5rem] w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left shadow-sm transition-colors hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
              <Palette className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium">Estilos de formato</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Tamaño, espaciado y alineación de lectura
              </span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          </button>
        </section>

        <section className="mt-6" aria-labelledby="contacto-title">
          <h2
            id="contacto-title"
            className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
          >
            Contacto con desarrolladores
          </h2>
          <div className="space-y-2 rounded-2xl border border-border bg-card p-2 shadow-sm">
            <button
              type="button"
              onClick={() => void openWhatsApp()}
              className="mobile-tap flex min-h-[4.5rem] w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                <MessageCircle className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">WhatsApp</span>
                <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                  {WHATSAPP_PHONE}
                </span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => void openEmail()}
              className="mobile-tap flex min-h-[4.5rem] w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-biblia-suave text-biblia">
                <Mail className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">Correo electrónico</span>
                <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                  {EMAIL}
                </span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => void copyEmail()}
              className="mobile-tap min-h-11 w-full rounded-xl border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {copied ? "Correo copiado" : "Copiar correo"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

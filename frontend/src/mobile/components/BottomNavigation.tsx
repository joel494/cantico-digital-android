import { BookOpen, House, Music2, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "../../lib/utils";

const ITEMS = [
  { to: "/", label: "Home", Icon: House, end: true },
  { to: "/canticos", label: "Cánticos", Icon: Music2, end: false },
  { to: "/biblia", label: "Biblia", Icon: BookOpen, end: false },
  { to: "/configuracion", label: "Configuración", Icon: Settings, end: false },
] as const;

export function BottomNavigation() {
  return (
    <nav
      aria-label="Navegación principal"
      className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-border"
    >
      {ITEMS.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              "mobile-tap flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-center text-[0.6875rem] font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent",
              isActive ? "text-biblia" : "text-muted-foreground",
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                className={cn("size-5", isActive && "stroke-[2.4]")}
                aria-hidden="true"
              />
              <span className="w-full truncate">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

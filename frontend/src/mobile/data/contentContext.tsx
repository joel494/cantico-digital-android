import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { clearMobileContentCache, loadMobileContent } from "./contentClient";
import type { MobileContent } from "./types";

interface ContentState {
  status: "loading" | "ready" | "error";
  content: MobileContent | null;
  error: string | null;
  refresh: () => Promise<void>;
}

const ContentContext = createContext<ContentState | null>(null);

export function MobileContentProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ContentState["status"]>("loading");
  const [content, setContent] = useState<MobileContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const value = await loadMobileContent();
      setContent(value);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(async () => {
    await clearMobileContentCache();
    await load();
  }, [load]);

  const value = useMemo(
    () => ({ status, content, error, refresh }),
    [status, content, error, refresh],
  );

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useMobileContent() {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error("useMobileContent debe usarse dentro de MobileContentProvider");
  }
  return context;
}

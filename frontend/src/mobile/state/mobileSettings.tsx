import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Preferences } from "@capacitor/preferences";

export type HymnAlignment = "left" | "center";
export type BibleAlignment = "left" | "justify";

export interface HymnFormatSettings {
  fontSizeRem: number;
  lineHeight: number;
  alignment: HymnAlignment;
  sectionSpacingRem: number;
  showSectionLabels: boolean;
}

export interface BibleFormatSettings {
  fontSizeRem: number;
  lineHeight: number;
  verseSpacingRem: number;
  showVerseNumbers: boolean;
  alignment: BibleAlignment;
}

export interface MobileSettings {
  hymns: HymnFormatSettings;
  bible: BibleFormatSettings;
}

const STORAGE_KEY = "cantico:mobile-format-settings:v1";

export const DEFAULT_MOBILE_SETTINGS: MobileSettings = {
  hymns: {
    fontSizeRem: 1.05,
    lineHeight: 1.55,
    alignment: "center",
    sectionSpacingRem: 1.25,
    showSectionLabels: true,
  },
  bible: {
    fontSizeRem: 1,
    lineHeight: 1.7,
    verseSpacingRem: 0.7,
    showVerseNumbers: true,
    alignment: "justify",
  },
};

function clamp(value: unknown, min: number, max: number, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function normalize(value: unknown): MobileSettings {
  const input = (value ?? {}) as Partial<MobileSettings>;
  const hymns = (input.hymns ?? {}) as Partial<HymnFormatSettings>;
  const bible = (input.bible ?? {}) as Partial<BibleFormatSettings>;
  return {
    hymns: {
      fontSizeRem: clamp(
        hymns.fontSizeRem,
        0.8,
        2,
        DEFAULT_MOBILE_SETTINGS.hymns.fontSizeRem,
      ),
      lineHeight: clamp(
        hymns.lineHeight,
        1.1,
        2.4,
        DEFAULT_MOBILE_SETTINGS.hymns.lineHeight,
      ),
      alignment: hymns.alignment === "left" ? "left" : "center",
      sectionSpacingRem: clamp(
        hymns.sectionSpacingRem,
        0.4,
        2.5,
        DEFAULT_MOBILE_SETTINGS.hymns.sectionSpacingRem,
      ),
      showSectionLabels: hymns.showSectionLabels !== false,
    },
    bible: {
      fontSizeRem: clamp(
        bible.fontSizeRem,
        0.8,
        2,
        DEFAULT_MOBILE_SETTINGS.bible.fontSizeRem,
      ),
      lineHeight: clamp(
        bible.lineHeight,
        1.1,
        2.4,
        DEFAULT_MOBILE_SETTINGS.bible.lineHeight,
      ),
      verseSpacingRem: clamp(
        bible.verseSpacingRem,
        0,
        2,
        DEFAULT_MOBILE_SETTINGS.bible.verseSpacingRem,
      ),
      showVerseNumbers: bible.showVerseNumbers !== false,
      alignment: bible.alignment === "left" ? "left" : "justify",
    },
  };
}

async function readSettings(): Promise<MobileSettings> {
  try {
    const { value } = await Preferences.get({ key: STORAGE_KEY });
    if (value) return normalize(JSON.parse(value));
  } catch {
    /* Capacitor no disponible (vista web): se usa localStorage. */
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch {
    /* almacenamiento no disponible */
  }
  return DEFAULT_MOBILE_SETTINGS;
}

async function writeSettings(settings: MobileSettings) {
  const value = JSON.stringify(settings);
  try {
    await Preferences.set({ key: STORAGE_KEY, value });
  } catch {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* almacenamiento no disponible */
    }
  }
}

interface MobileSettingsContextValue {
  settings: MobileSettings;
  ready: boolean;
  updateHymns: (patch: Partial<HymnFormatSettings>) => void;
  updateBible: (patch: Partial<BibleFormatSettings>) => void;
  resetHymns: () => void;
  resetBible: () => void;
}

const MobileSettingsContext = createContext<MobileSettingsContextValue | null>(
  null,
);

export function MobileSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<MobileSettings>(DEFAULT_MOBILE_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    readSettings().then((value) => {
      if (!mounted) return;
      setSettings(value);
      setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    void writeSettings(settings);
  }, [ready, settings]);

  const updateHymns = useCallback((patch: Partial<HymnFormatSettings>) => {
    setSettings((current) => ({
      ...current,
      hymns: normalize({ ...current, hymns: { ...current.hymns, ...patch } }).hymns,
    }));
  }, []);

  const updateBible = useCallback((patch: Partial<BibleFormatSettings>) => {
    setSettings((current) => ({
      ...current,
      bible: normalize({ ...current, bible: { ...current.bible, ...patch } }).bible,
    }));
  }, []);

  const resetHymns = useCallback(() => {
    setSettings((current) => ({
      ...current,
      hymns: DEFAULT_MOBILE_SETTINGS.hymns,
    }));
  }, []);

  const resetBible = useCallback(() => {
    setSettings((current) => ({
      ...current,
      bible: DEFAULT_MOBILE_SETTINGS.bible,
    }));
  }, []);

  const value = useMemo(
    () => ({ settings, ready, updateHymns, updateBible, resetHymns, resetBible }),
    [settings, ready, updateHymns, updateBible, resetHymns, resetBible],
  );

  return (
    <MobileSettingsContext.Provider value={value}>
      {children}
    </MobileSettingsContext.Provider>
  );
}

export function useMobileSettings() {
  const context = useContext(MobileSettingsContext);
  if (!context) {
    throw new Error("useMobileSettings debe usarse dentro de MobileSettingsProvider");
  }
  return context;
}

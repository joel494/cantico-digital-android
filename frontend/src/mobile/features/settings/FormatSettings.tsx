import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useMobileSettings } from "../../state/mobileSettings";
import { cn } from "../../../lib/utils";
import {
  PreviewCard,
  RangeField,
  SegmentedField,
  ToggleField,
} from "./controls";

type FormatTab = "canticos" | "biblia";

const TABS: Array<{ id: FormatTab; label: string }> = [
  { id: "canticos", label: "Cánticos" },
  { id: "biblia", label: "Biblia" },
];

export function FormatSettings() {
  const [tab, setTab] = useState<FormatTab>("canticos");
  const { settings, updateHymns, updateBible, resetHymns, resetBible } =
    useMobileSettings();

  return (
    <div className="mobile-content">
      <ScreenHeader title="Estilos de formato" backTo="/configuracion" />

      <div
        role="tablist"
        aria-label="Estilos de formato"
        className="sticky top-0 z-10 grid grid-cols-2 gap-2 border-b border-border bg-background/95 px-4 py-3 backdrop-blur"
      >
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "mobile-tap min-h-11 rounded-full border text-sm font-medium transition-colors",
              tab === item.id
                ? "border-biblia bg-biblia text-biblia-foreground"
                : "border-border bg-card text-muted-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <main className="mx-auto w-full max-w-2xl px-4 pb-8 pt-4" role="tabpanel">
        {tab === "canticos" ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Ajustes de lectura para los cánticos.
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetHymns}
                className="min-h-11 rounded-full"
              >
                <RotateCcw aria-hidden="true" />
                Restablecer
              </Button>
            </div>

            <RangeField
              label="Tamaño de fuente"
              hint={`${settings.hymns.fontSizeRem.toFixed(2)} rem`}
              min={0.8}
              max={2}
              step={0.05}
              value={settings.hymns.fontSizeRem}
              onChange={(fontSizeRem) => updateHymns({ fontSizeRem })}
            />
            <RangeField
              label="Interlineado"
              hint={settings.hymns.lineHeight.toFixed(2)}
              min={1.1}
              max={2.4}
              step={0.05}
              value={settings.hymns.lineHeight}
              onChange={(lineHeight) => updateHymns({ lineHeight })}
            />
            <RangeField
              label="Espacio entre estrofas"
              hint={`${settings.hymns.sectionSpacingRem.toFixed(2)} rem`}
              min={0.4}
              max={2.5}
              step={0.05}
              value={settings.hymns.sectionSpacingRem}
              onChange={(sectionSpacingRem) => updateHymns({ sectionSpacingRem })}
            />
            <SegmentedField
              label="Alineación"
              value={settings.hymns.alignment}
              options={[
                { value: "center", label: "Centrada" },
                { value: "left", label: "Izquierda" },
              ]}
              onChange={(alignment) => updateHymns({ alignment })}
            />
            <ToggleField
              label="Mostrar nombres de estrofas"
              checked={settings.hymns.showSectionLabels}
              onChange={(showSectionLabels) => updateHymns({ showSectionLabels })}
            />

            <PreviewCard>
              <div
                style={{
                  fontSize: `${settings.hymns.fontSizeRem}rem`,
                  lineHeight: settings.hymns.lineHeight,
                  textAlign: settings.hymns.alignment,
                }}
              >
                {settings.hymns.showSectionLabels && (
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                    Estrofa 1
                  </p>
                )}
                <p>Sublime gracia del Señor</p>
                <p>que a un infeliz salvó;</p>
              </div>
            </PreviewCard>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Ajustes de lectura para los versículos.
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetBible}
                className="min-h-11 rounded-full"
              >
                <RotateCcw aria-hidden="true" />
                Restablecer
              </Button>
            </div>

            <RangeField
              label="Tamaño de fuente"
              hint={`${settings.bible.fontSizeRem.toFixed(2)} rem`}
              min={0.8}
              max={2}
              step={0.05}
              value={settings.bible.fontSizeRem}
              onChange={(fontSizeRem) => updateBible({ fontSizeRem })}
            />
            <RangeField
              label="Interlineado"
              hint={settings.bible.lineHeight.toFixed(2)}
              min={1.1}
              max={2.4}
              step={0.05}
              value={settings.bible.lineHeight}
              onChange={(lineHeight) => updateBible({ lineHeight })}
            />
            <RangeField
              label="Espacio entre versículos"
              hint={`${settings.bible.verseSpacingRem.toFixed(2)} rem`}
              min={0}
              max={2}
              step={0.05}
              value={settings.bible.verseSpacingRem}
              onChange={(verseSpacingRem) => updateBible({ verseSpacingRem })}
            />
            <SegmentedField
              label="Alineación"
              value={settings.bible.alignment}
              options={[
                { value: "justify", label: "Justificada" },
                { value: "left", label: "Izquierda" },
              ]}
              onChange={(alignment) => updateBible({ alignment })}
            />
            <ToggleField
              label="Mostrar números de versículo"
              checked={settings.bible.showVerseNumbers}
              onChange={(showVerseNumbers) => updateBible({ showVerseNumbers })}
            />

            <PreviewCard>
              <p
                style={{
                  fontSize: `${settings.bible.fontSizeRem}rem`,
                  lineHeight: settings.bible.lineHeight,
                  textAlign: settings.bible.alignment,
                  marginBottom: `${settings.bible.verseSpacingRem}rem`,
                }}
              >
                {settings.bible.showVerseNumbers && (
                  <sup className="mr-0.5 font-semibold text-biblia">16</sup>
                )}
                Porque de tal manera amó Dios al mundo, que ha dado a su Hijo
                unigénito…
              </p>
            </PreviewCard>
          </div>
        )}
      </main>
    </div>
  );
}

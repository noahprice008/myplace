import { useEffect } from "react";
import { Accessibility, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/lib/i18n";
import { usePersistentState } from "@/lib/store";
import { cn } from "@/lib/utils";

export type TextSize = "normal" | "large" | "xl";

export type A11ySettings = {
  textSize: TextSize;
  contrast: boolean;
  reduceMotion: boolean;
  underlineLinks: boolean;
  boldText: boolean;
  bigTargets: boolean;
};

export const DEFAULT_A11Y: A11ySettings = {
  textSize: "normal",
  contrast: false,
  reduceMotion: false,
  underlineLinks: false,
  boldText: false,
  bigTargets: false,
};

export const useA11ySettings = () => usePersistentState<A11ySettings>("a11y", DEFAULT_A11Y);

/** Applies the saved accessibility settings to <html> as data attributes. */
export function useApplyA11y() {
  const [settings] = useA11ySettings();

  useEffect(() => {
    const el = document.documentElement;
    el.dataset.textSize = settings.textSize;
    el.toggleAttribute("data-contrast", settings.contrast);
    el.toggleAttribute("data-reduce-motion", settings.reduceMotion);
    el.toggleAttribute("data-underline-links", settings.underlineLinks);
    el.toggleAttribute("data-bold-text", settings.boldText);
    el.toggleAttribute("data-big-targets", settings.bigTargets);
  }, [settings]);
}

export function AccessibilityMenu() {
  const { t } = useLanguage();
  const [settings, setSettings] = useA11ySettings();
  useApplyA11y();

  const set = <K extends keyof A11ySettings>(key: K, value: A11ySettings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const toggles: { key: keyof A11ySettings; label: string }[] = [
    { key: "contrast", label: t("a11y.contrast") },
    { key: "boldText", label: t("a11y.boldText") },
    { key: "underlineLinks", label: t("a11y.underline") },
    { key: "reduceMotion", label: t("a11y.motion") },
    { key: "bigTargets", label: t("a11y.targets") },
  ];

  const sizes: { id: TextSize; label: string }[] = [
    { id: "normal", label: t("a11y.sizeNormal") },
    { id: "large", label: t("a11y.sizeLarge") },
    { id: "xl", label: t("a11y.sizeXl") },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("a11y.title")}
          title={t("a11y.title")}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-accent"
        >
          <Accessibility className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-2xl p-3">
        <DropdownMenuLabel className="px-0 pt-0">{t("a11y.title")}</DropdownMenuLabel>

        <Label className="text-[11px] font-bold text-muted-foreground">{t("a11y.textSize")}</Label>
        <div className="mb-2 mt-1 grid grid-cols-3 gap-1">
          {sizes.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => set("textSize", s.id)}
              className={cn(
                "min-h-9 rounded-xl border-2 px-1 text-[11px] font-bold",
                settings.textSize === s.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        {toggles.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-2 py-1.5">
            <Label htmlFor={`a11y-${row.key}`} className="text-xs font-bold">
              {row.label}
            </Label>
            <Switch
              id={`a11y-${row.key}`}
              checked={Boolean(settings[row.key])}
              onCheckedChange={(v) => set(row.key, v as never)}
            />
          </div>
        ))}

        <DropdownMenuSeparator />
        <Button
          variant="outline"
          className="w-full rounded-full text-xs font-bold"
          onClick={() => setSettings(DEFAULT_A11Y)}
        >
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> {t("a11y.reset")}
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

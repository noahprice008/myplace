import { Link, useRouterState } from "@tanstack/react-router";
import {
  NotebookPen,
  Wallet,
  CalendarDays,
  CalendarClock,
  PiggyBank,
  Sun,
  Moon,
  Crown,
  Languages,
  Download,
  Upload,
} from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import logo from "@/assets/myplace-logo.png";
import { AccessibilityMenu } from "@/components/AccessibilityMenu";
import { QuickAdd } from "@/components/QuickAdd";
import { UpgradeDialog } from "@/components/UpgradeDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/use-theme";
import { exportBackup, importBackup } from "@/lib/backup";
import { LANGUAGES, useLanguage, type LangCode, type TKey } from "@/lib/i18n";
import { useProStatus } from "@/lib/store";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", key: "nav.wall", icon: NotebookPen },
  { to: "/work", key: "nav.work", icon: Wallet },
  { to: "/cashflow", key: "nav.cash", icon: PiggyBank },
  { to: "/calendar", key: "nav.diary", icon: CalendarDays },
  { to: "/schedule", key: "nav.hours", icon: CalendarClock },
] as const satisfies readonly { to: string; key: TKey; icon: typeof NotebookPen }[];

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { theme, toggle } = useTheme();
  const { t, lang, setLang } = useLanguage();
  const [pro] = useProStatus();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  async function handleImport(file: File | undefined) {
    if (!file) return;
    try {
      await importBackup(file);
      toast.success(t("backup.restored"));
      setTimeout(() => window.location.reload(), 600);
    } catch {
      toast.error(t("backup.bad"));
    }
  }

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col border-border bg-background sm:border-x">
        <header className="sticky top-0 z-20 bg-card/95 pt-[env(safe-area-inset-top)] backdrop-blur print:hidden">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 pb-3 pt-3">
            <img
              src={logo}
              alt="myplace logo"
              width={1024}
              height={1024}
              className="h-9 w-9 shrink-0 rounded-xl shadow-sm shadow-primary/25"
            />

            <div className="min-w-0 text-center">
              <h1 className="truncate text-xl font-extrabold leading-tight brand-text">{title}</h1>
              {subtitle ? (
                <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={toggle}
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-accent"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              <AccessibilityMenu />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={t("header.language")}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-accent"
                  >
                    <Languages className="h-4 w-4" />
                    <span className="sr-only">{lang.toUpperCase()}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-96 w-56 overflow-y-auto rounded-2xl">
                  <DropdownMenuLabel>{t("header.language")}</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={lang}
                    onValueChange={(v) => setLang(v as LangCode)}
                  >
                    {LANGUAGES.map((l) => (
                      <DropdownMenuRadioItem key={l.code} value={l.code}>
                        {l.native}
                        <span className="ms-1 text-xs text-muted-foreground">{l.label}</span>
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => exportBackup()}>
                    <Download className="mr-2 h-4 w-4" />
                    {t("header.export")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => importRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    {t("header.import")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <input
                ref={importRef}
                type="file"
                accept="application/json"
                hidden
                onChange={(e) => {
                  void handleImport(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />

              <button
                type="button"
                onClick={() => setUpgradeOpen(true)}
                aria-label={pro.plan !== "free" ? t("header.pro") : t("header.upgrade")}
                title={pro.plan !== "free" ? t("header.pro") : t("header.upgrade")}
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors",
                  pro.plan !== "free"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-primary bg-primary text-primary-foreground",
                )}
              >
                <Crown className="h-4 w-4" />
              </button>
            </div>
          </div>


          <div className="h-1 w-full brand-stripe" />
        </header>

        <main className="flex-1 px-3 pb-32 pt-4 sm:px-4">{children}</main>

        <QuickAdd />

        <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-lg -translate-x-1/2 border-t border-border bg-card/95 backdrop-blur print:hidden">
          <ul className="flex items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)] pt-1">
            {tabs.map((tab) => {
              const active = pathname === tab.to;
              const Icon = tab.icon;
              return (
                <li key={tab.to} className="flex-1">
                  <Link
                    to={tab.to}
                    className={cn(
                      "flex min-h-[54px] flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 text-[10px] font-bold transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {t(tab.key)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Eraser, Lock, LockOpen, Palette } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { ColorPicker } from "@/components/ColorPicker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useLanguage, getLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  SLOT_COLORS,
  slotColor,
  toDateKey,
  useAvailability,
  useScheduleHours,
  useScheduleLocks,
  useSlotColors,
  useWorkplaces,
  type JobId,
} from "@/lib/store";


export const Route = createFileRoute("/schedule")({
  head: () => ({
    meta: [
      { title: "Schedule — myplace" },
      {
        name: "description",
        content:
          "Colour in working hours Sunday to Saturday across a customisable time range, for each workplace, personal time and more.",
      },
      { property: "og:title", content: "Schedule — myplace" },
      {
        property: "og:description",
        content: "Paint the week's working hours by job and lock the timetable when it's final.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SchedulePage,
});

/** Localised weekday names, Sunday first, in the active language. */
const weekdayNames = (style: "long" | "short") => {
  const fmt = new Intl.DateTimeFormat(getLocale(), { weekday: style });
  // 2024-01-07 is a Sunday
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2024, 0, 7 + i)));
};
const clampHour = (h: number) => Math.min(24, Math.max(0, h));
const hourLabel = (h: number) => {
  const hh = ((h % 24) + 24) % 24;
  const suffix = hh < 12 ? "am" : "pm";
  const base = hh % 12 === 0 ? 12 : hh % 12;
  return `${base}${suffix}`;
};

type JobMeta = { id: JobId; label: string; dot: string; cell: string };

/** Legacy slot values written before workplaces had their own ids. */
const LEGACY: Record<string, number> = { workplace1: 0, workplace2: 1 };



const slotLabel = (h: number) => `${hourLabel(h)}–${hourLabel(h + 1)}`;

function weekStart(offsetWeeks: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay() + offsetWeeks * 7);
  return d;
}

function SchedulePage() {
  const { t } = useLanguage();
  const [availability, setAvailability] = useAvailability();
  const [locks, setLocks] = useScheduleLocks();
  const [range, setRange] = useScheduleHours();
  const [workplaces] = useWorkplaces();
  const [fixedColors, setFixedColors] = useSlotColors();
  const [offset, setOffset] = useState(0);
  const [job, setJob] = useState<JobId>("");
  const [painting, setPainting] = useState(false);

  const JOBS = useMemo<JobMeta[]>(() => {
    const fromWorkplaces = workplaces.map((w, i) => {
      const c = slotColor(w.color ?? SLOT_COLORS[i % SLOT_COLORS.length].id);
      return { id: w.id, label: w.name, dot: c.dot, cell: c.cell };
    });
    const fixed = (["personal", "other", "unavailable"] as const).map((kind) => {
      const c = slotColor(fixedColors[kind]);
      return {
        id: kind as JobId,
        label: t(`sched.${kind}` as const),
        dot: c.dot,
        cell: c.cell,
      };
    });
    return [...fromWorkplaces, ...fixed];
  }, [workplaces, fixedColors, t]);

  const jobMeta = (id: JobId): JobMeta => {
    const direct = JOBS.find((j) => j.id === id);
    if (direct) return direct;
    const legacy = LEGACY[id];
    if (legacy !== undefined && workplaces[legacy]) {
      return JOBS.find((j) => j.id === workplaces[legacy].id) ?? JOBS[JOBS.length - 1];
    }
    return JOBS[JOBS.length - 1];
  };

  useEffect(() => {
    if (!JOBS.some((j) => j.id === job)) setJob(JOBS[0]?.id ?? "");
  }, [JOBS, job]);


  const HOURS = useMemo(() => {
    const from = clampHour(range.start);
    const to = clampHour(range.end);
    const hours: number[] = [];
    for (let h = from; h < Math.max(to, from + 1); h++) hours.push(h);
    return hours;
  }, [range.start, range.end]);

  const start = weekStart(offset);
  const key = toDateKey(start);
  const slots = useMemo(() => availability[key] ?? {}, [availability, key]);
  const locked = locks[key] ?? false;

  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const setSlots = (fn: (prev: Record<string, JobId>) => Record<string, JobId>) => {
    if (locked) {
      toast.info("Week is locked — unlock to make changes");
      return;
    }
    setAvailability((prev) => ({ ...prev, [key]: fn(prev[key] ?? {}) }));
  };

  const paint = (id: string, toggle: boolean) =>
    setSlots((current) => {
      const next = { ...current };
      if (toggle && next[id] === job) delete next[id];
      else next[id] = job;
      return next;
    });

  const setMany = (ids: string[]) =>
    setSlots((current) => {
      const next = { ...current };
      const allSame = ids.every((id) => next[id] === job);
      ids.forEach((id) => {
        if (allSame) delete next[id];
        else next[id] = job;
      });
      return next;
    });


  function summaryText() {
    const lines: string[] = [
      `Working hours — week of ${start.toLocaleDateString(getLocale(), { day: "numeric", month: "short" })} to ${end.toLocaleDateString(getLocale(), { day: "numeric", month: "short" })}`,
      "",
    ];
    weekdayNames("long").forEach((day, dayIndex) => {
      const blocks: { job: JobId; from: number; to: number }[] = [];
      for (const h of HOURS) {
        const value = slots[`${dayIndex}-${h}`];
        if (!value) continue;
        const last = blocks[blocks.length - 1];
        if (last && last.job === value && last.to === h) last.to = h + 1;
        else blocks.push({ job: value, from: h, to: h + 1 });
      }
      if (blocks.length === 0) {
        lines.push(`${day}: not working`);
        return;
      }
      lines.push(
        `${day}: ${blocks.map((b) => `${b.from}-${b.to} ${jobMeta(b.job).label}`).join(", ")}`,
      );
    });
    lines.push("", "— myplace");
    return lines.join("\n");
  }

  const setStart = (h: number) => {
    const next = clampHour(h);
    setRange((prev) => ({ start: next, end: Math.max(clampHour(prev.end), next + 1) }));
  };
  const setEnd = (h: number) => {
    const next = clampHour(h);
    setRange((prev) => ({ start: Math.min(clampHour(prev.start), next - 1), end: next }));
  };

  return (
    <AppShell
      title={t("title.hours")}
      subtitle={`${t("sub.hours")} · ${hourLabel(HOURS[0])} – ${hourLabel(HOURS[HOURS.length - 1] + 1)}`}
    >
      <Card className="mb-4 gap-3 border-2 p-3">
        <div className="flex items-center gap-1.5 text-sm font-extrabold">
          <Clock className="h-4 w-4" /> {t("sched.displayedHours")}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              [t("sched.starts"), HOURS[0], setStart, 0, HOURS[HOURS.length - 1]],
              [t("sched.ends"), HOURS[HOURS.length - 1] + 1, setEnd, HOURS[0] + 1, 24],
            ] as const
          ).map(([label, value, set, min, max]) => (
            <div key={label} className="flex flex-col gap-1">
              <Label className="text-[11px] font-bold text-muted-foreground">{label}</Label>

              <div className="flex items-center justify-between rounded-xl border-2 border-border px-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full"
                  disabled={value <= min}
                  aria-label={`${label} earlier`}
                  onClick={() => set(value - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-extrabold">{hourLabel(value)}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full"
                  disabled={value >= max}
                  aria-label={`${label} later`}
                  onClick={() => set(value + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["9 to 5", 8, 17],
              ["Morning", 6, 12],
              ["Evening", 16, 23],
              ["Full 24h", 0, 24],
            ] as const
          ).map(([label, s, e]) => (
            <button
              key={label}
              onClick={() => setRange({ start: s, end: e })}
              className="rounded-full border-2 border-border px-3 py-1 text-[11px] font-bold text-muted-foreground"
            >
              {label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="gap-3 border-2 p-3">
        <div className="flex items-center justify-between">
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full"
            onClick={() => setOffset((o) => o - 1)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <p className="text-sm font-extrabold">
              {start.toLocaleDateString(getLocale(), { day: "numeric", month: "short" })} –{" "}
              {end.toLocaleDateString(getLocale(), { day: "numeric", month: "short" })}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {offset === 0
                ? t("sched.thisWeek")
                : offset === 1
                  ? t("sched.nextWeek")
                  : `+${offset}`}
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full"
            onClick={() => setOffset((o) => o + 1)}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex flex-wrap justify-center gap-1.5">
          {JOBS.map((j) => (
            <button
              key={j.id}
              onClick={() => setJob(j.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-xs font-extrabold transition-colors",
                job === j.id ? "border-foreground/50 bg-muted" : "border-transparent bg-muted/50",
              )}
            >
              <span className={cn("h-2.5 w-2.5 rounded-full", j.dot)} />
              {j.label}
            </button>
          ))}
        </div>
        <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
          {locked ? (
            <>
              <Lock className="h-3 w-3" /> {t("sched.lockedMsg")}
            </>
          ) : workplaces.length === 0 ? (
            t("sched.noWorkplaces")
          ) : (
            t("sched.pickJob")
          )}
        </p>


        <div
          className={cn(
            "grid touch-none grid-cols-[auto_repeat(7,1fr)] gap-1",
            locked && "opacity-80",
          )}
          onPointerUp={() => setPainting(false)}
          onPointerLeave={() => setPainting(false)}
        >

          <span />
          {weekdayNames("short").map((d, i) => (
            <button
              key={d}
              onClick={() => setMany(HOURS.map((h) => `${i}-${h}`))}
              className="rounded-lg py-1 text-[11px] font-extrabold text-muted-foreground hover:bg-muted"
            >
              {d}
            </button>
          ))}

          {HOURS.map((h) => (
            <Fragment key={`row-${h}`}>
              <button
                onClick={() => setMany(weekdayNames("long").map((_, i) => `${i}-${h}`))}
                className="pr-1 text-right text-[10px] font-bold text-muted-foreground"
              >
                {slotLabel(h)}
              </button>
              {weekdayNames("long").map((_, dayIndex) => {
                const id = `${dayIndex}-${h}`;
                const value = slots[id];
                return (
                  <button
                    key={id}
                    onPointerDown={() => {
                      setPainting(true);
                      paint(id, true);
                    }}
                    onPointerEnter={() => {
                      if (painting) paint(id, false);
                    }}
                    aria-label={`${weekdayNames("long")[dayIndex]} ${slotLabel(h)} ${value ? jobMeta(value).label : "not working"}`}
                    className={cn(
                      "h-8 rounded-lg border-2 transition-colors",
                      value ? jobMeta(value).cell : "border-border/60 bg-muted/40",
                    )}
                  />
                );
              })}
            </Fragment>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] font-bold text-muted-foreground">
          {JOBS.map((j) => (
            <span key={j.id} className="flex items-center gap-1">
              <span className={cn("h-2.5 w-2.5 rounded", j.dot)} /> {j.label}
            </span>
          ))}
        </div>
      </Card>

      <Card className="mt-4 gap-3 border-2 p-3">
        <div className="flex items-center gap-1.5 text-sm font-extrabold">
          <Palette className="h-4 w-4" /> {t("sched.colours")}
        </div>
        {(["personal", "other", "unavailable"] as const).map((kind) => (
          <div key={kind} className="flex flex-col gap-1.5">
            <Label className="text-[11px] font-bold text-muted-foreground">
              {t(`sched.${kind}` as const)}
            </Label>
            <ColorPicker
              value={fixedColors[kind]}
              onChange={(c) => setFixedColors((prev) => ({ ...prev, [kind]: c }))}
            />
          </div>
        ))}
        <p className="text-[11px] text-muted-foreground">{t("sched.noWorkplaces")}</p>
      </Card>

      <div className="mt-4 flex gap-2">
        <Button
          variant="outline"
          className="flex-1 rounded-full border-2 font-bold"
          disabled={locked}
          onClick={() => setAvailability((prev) => ({ ...prev, [key]: {} }))}
        >
          <Eraser className="mr-1.5 h-4 w-4" /> {t("common.clear")}
        </Button>
        <Button
          className="flex-1 rounded-full font-extrabold"
          variant={locked ? "outline" : "default"}
          onClick={() => {
            setLocks((prev) => ({ ...prev, [key]: !locked }));
            toast.success(locked ? t("sched.unlockWeek") : t("sched.lockWeek"));
          }}
        >
          {locked ? (
            <>
              <LockOpen className="mr-1.5 h-4 w-4" /> {t("sched.unlockWeek")}
            </>
          ) : (
            <>
              <Lock className="mr-1.5 h-4 w-4" /> {t("sched.lockWeek")}
            </>
          )}
        </Button>
      </div>


      <Card className="mt-4 gap-2 border-2 p-4">
        <h2 className="text-sm font-extrabold">{t("common.preview")}</h2>
        <pre className="whitespace-pre-wrap font-sans text-xs text-muted-foreground">
          {summaryText()}
        </pre>
      </Card>

    </AppShell>
  );
}

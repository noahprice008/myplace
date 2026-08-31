import { getLocale } from "@/lib/i18n";
import { Briefcase, PiggyBank, CalendarDays, CalendarClock, X } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { WallEvent } from "@/lib/events";

const META = {
  work: { icon: Briefcase, label: "Work", tone: "bg-primary/12 text-primary" },
  cash: { icon: PiggyBank, label: "Cash", tone: "bg-destructive/12 text-destructive" },
  diary: { icon: CalendarDays, label: "Diary", tone: "bg-ocean-aqua/20 text-ocean-deep" },
  hours: { icon: CalendarClock, label: "Hours", tone: "bg-secondary text-secondary-foreground" },
} as const;

export function EventCard({ event, onDismiss }: { event: WallEvent; onDismiss: () => void }) {
  const meta = META[event.source] ?? META.work;
  const Icon = meta.icon;
  const time = new Date(event.createdAt).toLocaleTimeString(getLocale(), {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card className="flex items-center gap-3 rounded-3xl border-2 border-dashed p-3">
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl", meta.tone)}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-extrabold">{event.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {meta.label}
          {event.detail ? ` · ${event.detail}` : ""} · {time}
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-accent"
      >
        <X className="h-4 w-4" />
      </button>
    </Card>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { useLanguage, getLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { logEvent } from "@/lib/events";
import { cn } from "@/lib/utils";
import {
  uid,
  useMoney,
  toDateKey,
  useAppointments,
  useShifts,
  useWorkplaces,
  type Appointment,
} from "@/lib/store";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — myplace" },
      {
        name: "description",
        content: "One master calendar with every work shift and personal appointment.",
      },
      { property: "og:title", content: "Calendar — myplace" },
      {
        property: "og:description",
        content: "See work shifts and appointments together, month by month.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CalendarPage,
});

const weekdayInitials = () => {
  const fmt = new Intl.DateTimeFormat(getLocale(), { weekday: "short" });
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2024, 0, 7 + i)).slice(0, 2));
};

function CalendarPage() {
  const { t } = useLanguage();
  const money = useMoney();
  const [shifts] = useShifts();
  const [workplaces] = useWorkplaces();
  const [appointments, setAppointments] = useAppointments();

  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<string>(toDateKey(today));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", time: "", note: "" });

  const days = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells: (string | null)[] = Array.from({ length: first.getDay() }, () => null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(toDateKey(new Date(cursor.getFullYear(), cursor.getMonth(), d)));
    }
    return cells;
  }, [cursor]);

  const dayShifts = shifts.filter((s) => s.date === selected);
  const dayAppointments = appointments
    .filter((a) => a.date === selected)
    .sort((a, b) => a.time.localeCompare(b.time));

  function addAppointment() {
    if (!form.title.trim()) {
      toast.error("Give the appointment a title");
      return;
    }
    const appointment: Appointment = {
      id: uid(),
      title: form.title.trim(),
      date: selected,
      time: form.time,
      note: form.note.trim(),
    };
    setAppointments((prev) => [...prev, appointment]);
    setForm({ title: "", time: "", note: "" });
    setDialogOpen(false);
    logEvent("diary", `Appointment: ${appointment.title}`, appointment.date);
    toast.success("Appointment added");
  }

  return (
    <AppShell title={t("title.diary")} subtitle={t("sub.diary")}>
      <Card className="gap-3 border-2 p-4">
        <div className="flex items-center justify-between">
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-extrabold">
            {cursor.toLocaleDateString(getLocale(), { month: "long", year: "numeric" })}
          </h2>
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-extrabold text-muted-foreground">
          {weekdayInitials().map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((key, i) => {
            if (!key) return <span key={`empty-${i}`} />;
            const hasShift = shifts.some((s) => s.date === key);
            const hasAppt = appointments.some((a) => a.date === key);
            const isToday = key === toDateKey(today);
            const isSelected = key === selected;
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center rounded-xl text-sm font-bold transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : isToday
                      ? "bg-secondary"
                      : "hover:bg-muted",
                )}
              >
                {Number(key.slice(-2))}
                <span className="mt-0.5 flex h-1.5 gap-0.5">
                  {hasShift && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  {hasAppt && <span className="h-1.5 w-1.5 rounded-full bg-destructive" />}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex justify-center gap-4 border-t border-border pt-2 text-[11px] font-bold text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-primary" /> Work
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-destructive" /> Appointment
          </span>
        </div>
      </Card>

      <div className="mt-5 flex items-center justify-between">
        <h2 className="text-base font-extrabold">
          {new Date(`${selected}T00:00:00`).toLocaleDateString(getLocale(), {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </h2>
        <Button size="sm" className="rounded-full font-bold" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" /> Add
        </Button>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {dayShifts.map((s) => {
          const wp = workplaces.find((w) => w.id === s.workplaceId);
          return (
            <Card
              key={s.id}
              className="flex-row items-center justify-between gap-2 border-2 border-primary/40 bg-primary/10 p-3"
            >
              <div>
                <p className="text-sm font-extrabold">{wp?.name ?? "Work"}</p>
                <p className="text-xs text-muted-foreground">
                  {wp?.type === "hourly" ? `${s.hours} hours` : wp?.type === "daily" ? `${s.days ?? 0} days` : "Tasks"}
                </p>
              </div>
              <span className="font-extrabold text-primary">{money(s.total)}</span>
            </Card>
          );
        })}

        {dayAppointments.map((a) => (
          <Card
            key={a.id}
            className="flex-row items-start justify-between gap-2 border-2 border-destructive/30 p-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-extrabold">
                {a.time ? `${a.time} · ` : ""}
                {a.title}
              </p>
              {a.note && <p className="text-xs text-muted-foreground">{a.note}</p>}
            </div>
            <button
              onClick={() => setAppointments((prev) => prev.filter((x) => x.id !== a.id))}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </Card>
        ))}

        {dayShifts.length === 0 && dayAppointments.length === 0 && (
          <div className="rounded-3xl border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nothing planned for this day.
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>New appointment</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="font-bold">Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Dentist"
                className="h-11 rounded-xl border-2"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="font-bold">Time (optional)</Label>
              <Input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="h-11 rounded-xl border-2"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="font-bold">Note</Label>
              <Textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="min-h-16 rounded-xl border-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full rounded-full font-extrabold" onClick={addAppointment}>
              Save appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Minus, Plus, Trash2, Building2, ChevronLeft, ChevronRight } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { ColorPicker } from "@/components/ColorPicker";
import { useLanguage, getLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { logEvent } from "@/lib/events";

import {
  uid,
  toDateKey,
  EXTRA_MINUTE_RATE,
  CURRENCIES,
  currencySymbol,
  useCurrency,
  useMoney,
  useShifts,
  useWorkplaces,
  type Shift,
  type Workplace,
  type SlotColorId,
} from "@/lib/store";

export const Route = createFileRoute("/work")({
  head: () => ({
    meta: [
      { title: "Work & Earnings — myplace" },
      {
        name: "description",
        content:
          "Add workplaces, log shifts and see weekly and monthly earnings in one place.",
      },
      { property: "og:title", content: "Work & Earnings — myplace" },
      {
        property: "og:description",
        content: "Track treatments, hours and earnings for every workplace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WorkPage,
});

function startOfWeek(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - copy.getDay());
  return copy;
}

function WorkPage() {
  const { t } = useLanguage();
  const money = useMoney();
  const [currency, setCurrency] = useCurrency();
  const [workplaces, setWorkplaces] = useWorkplaces();
  const [shifts, setShifts] = useShifts();

  const addShift = (shift: Shift) => setShifts((prev) => [shift, ...prev]);

  const totals = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    let week = 0;
    let month = 0;
    const byWorkplace: Record<string, number> = {};
    const weekByWorkplace: Record<string, number> = {};
    const monthByWorkplace: Record<string, number> = {};
    const byMonth: Record<string, number> = {};

    for (const s of shifts) {
      const d = new Date(`${s.date}T00:00:00`);
      if (d >= weekStart) {
        week += s.total;
        weekByWorkplace[s.workplaceId] = (weekByWorkplace[s.workplaceId] ?? 0) + s.total;
      }
      if (s.date.startsWith(monthKey)) {
        month += s.total;
        monthByWorkplace[s.workplaceId] = (monthByWorkplace[s.workplaceId] ?? 0) + s.total;
      }
      byWorkplace[s.workplaceId] = (byWorkplace[s.workplaceId] ?? 0) + s.total;
      const mk = s.date.slice(0, 7);
      byMonth[mk] = (byMonth[mk] ?? 0) + s.total;
    }
    const grand = Object.values(byWorkplace).reduce((a, b) => a + b, 0);
    return { week, month, byWorkplace, weekByWorkplace, monthByWorkplace, byMonth, grand };
  }, [shifts]);


  return (
    <AppShell title={t("title.work")} subtitle={t("sub.work")}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Currency
        </span>
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger className="h-9 w-44 rounded-full border-2 font-bold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.symbol} {c.code} · {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <Card className="gap-1 border-2 border-primary/40 bg-primary/10 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            This week
          </p>
          <p className="text-2xl font-extrabold text-primary">{money(totals.week)}</p>
        </Card>
        <Card className="gap-1 border-2 border-secondary/50 bg-secondary/15 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            This month
          </p>
          <p className="text-2xl font-extrabold">{money(totals.month)}</p>
        </Card>
      </div>

      <Tabs defaultValue="log">
        <TabsList className="mb-4 grid w-full grid-cols-3 rounded-full">
          <TabsTrigger value="log" className="rounded-full font-bold">
            Log shift
          </TabsTrigger>
          <TabsTrigger value="shifts" className="rounded-full font-bold">
            Shifts
          </TabsTrigger>
          <TabsTrigger value="totals" className="rounded-full font-bold">
            Totals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="log" className="flex flex-col gap-4">
          {workplaces.map((wp) => (
            <ShiftLogger
              key={wp.id}
              workplace={wp}
              onSave={addShift}
              stats={{
                week: totals.weekByWorkplace[wp.id] ?? 0,
                month: totals.monthByWorkplace[wp.id] ?? 0,
                all: totals.byWorkplace[wp.id] ?? 0,
              }}
              onRemove={
                wp.removable
                  ? () => {
                      setWorkplaces((prev) => prev.filter((w) => w.id !== wp.id));
                      setShifts((prev) => prev.filter((s) => s.workplaceId !== wp.id));
                      toast.success(`${wp.name} removed`);
                    }
                  : undefined
              }
            />
          ))}

          <AddWorkplaceDialog onAdd={(wp) => setWorkplaces((prev) => [...prev, wp])} />
        </TabsContent>

        <TabsContent value="shifts">
          <ShiftList
            shifts={shifts}
            workplaces={workplaces}
            onDelete={(id) => setShifts((prev) => prev.filter((s) => s.id !== id))}
          />
        </TabsContent>

        <TabsContent value="totals" className="flex flex-col gap-4">
          <Card className="gap-3 border-2 p-4">
            <h2 className="text-base font-extrabold">By workplace</h2>
            {workplaces.map((wp) => {
              const value = totals.byWorkplace[wp.id] ?? 0;
              const pct = totals.grand > 0 ? (value / totals.grand) * 100 : 0;
              return (
                <div key={wp.id} className="flex flex-col gap-1">
                  <div className="flex justify-between text-sm font-bold">
                    <span>{wp.name}</span>
                    <span>{money(value)}</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full brand-stripe" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex gap-3 text-[11px] font-bold text-muted-foreground">
                    <span>Week {money(totals.weekByWorkplace[wp.id] ?? 0)}</span>
                    <span>Month {money(totals.monthByWorkplace[wp.id] ?? 0)}</span>
                  </div>
                </div>
              );
            })}
            <div className="flex flex-col gap-1 rounded-2xl bg-primary/10 px-3 py-2">
              <div className="flex justify-between text-sm font-extrabold">
                <span>All workplaces combined</span>
                <span>{money(totals.grand)}</span>
              </div>
              <div className="flex gap-3 text-[11px] font-bold text-muted-foreground">
                <span>Week {money(totals.week)}</span>
                <span>Month {money(totals.month)}</span>
              </div>
            </div>
          </Card>


          <DayHistory shifts={shifts} workplaces={workplaces} />

          <Card className="gap-2 border-2 p-4">
            <h2 className="text-base font-extrabold">By month</h2>
            {Object.keys(totals.byMonth).length === 0 ? (
              <p className="text-sm text-muted-foreground">No shifts logged yet.</p>
            ) : (
              Object.entries(totals.byMonth)
                .sort((a, b) => b[0].localeCompare(a[0]))
                .map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm font-bold">
                    <span>
                      {new Date(`${key}-01T00:00:00`).toLocaleDateString(getLocale(), {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    <span>{money(value)}</span>
                  </div>
                ))
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function Stepper({
  value,
  onChange,
  step = 1,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        size="icon"
        variant="outline"
        className="h-10 w-10 rounded-full border-2"
        onClick={() => onChange(Math.max(0, +(value - step).toFixed(2)))}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span className="min-w-14 text-center text-lg font-extrabold">
        {value}
        {suffix ?? ""}
      </span>
      <Button
        size="icon"
        variant="outline"
        className="h-10 w-10 rounded-full border-2"
        onClick={() => onChange(+(value + step).toFixed(2))}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

function ShiftLogger({
  workplace,
  onSave,
  onRemove,
  stats,
}: {
  workplace: Workplace;
  onSave: (s: Shift) => void;
  onRemove?: () => void;
  stats: { week: number; month: number; all: number };
}) {
  const money = useMoney();
  const [date, setDate] = useState(toDateKey(new Date()));
  const [hours, setHours] = useState(0);
  const [days, setDays] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [extraMinutes, setExtraMinutes] = useState(0);

  const total =
    workplace.type === "hourly"
      ? hours * workplace.rate
      : workplace.type === "daily"
        ? days * workplace.rate
        : workplace.treatments.reduce((sum, t) => sum + (counts[t.id] ?? 0) * t.price, 0) +
          extraMinutes * EXTRA_MINUTE_RATE;

  const invoiceTotal = workplace.billable
    ? workplace.type === "hourly"
      ? hours * (workplace.invoiceRate || workplace.rate)
      : total
    : 0;

  function save() {
    if (total <= 0) {
      toast.error("Add some work first");
      return;
    }
    onSave({
      id: uid(),
      workplaceId: workplace.id,
      date,
      hours: workplace.type === "hourly" ? hours : 0,
      days: workplace.type === "daily" ? days : 0,
      counts,
      extraMinutes: workplace.type === "treatment" ? extraMinutes : 0,
      total,
      note: "",
    });
    logEvent(
      "work",
      `${money(total)} logged at ${workplace.name}`,
      workplace.type === "hourly"
        ? `${hours}h`
        : workplace.type === "daily"
          ? `${days} day(s)`
          : "tasks",
    );
    if (workplace.billable && invoiceTotal > 0) {
      logEvent("cash", `Invoice ready: ${money(invoiceTotal)}`, workplace.name);
    }
    setHours(0);
    setDays(0);
    setCounts({});
    setExtraMinutes(0);
    toast.success(`${money(total)} logged at ${workplace.name}`);
  }




  return (
    <Card className="gap-4 border-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-extrabold">{workplace.name}</h2>
          <p className="text-xs text-muted-foreground">
            {workplace.type === "hourly"
              ? `${money(workplace.rate)} per hour`
              : workplace.type === "daily"
                ? `${money(workplace.rate)} per day`
                : workplace.treatments.map((t) => `${t.name} ${money(t.price)}`).join(" · ")}
          </p>
        </div>
        {onRemove && (
          <button onClick={onRemove} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-muted/50 px-3 py-2 text-center">
        {(
          [
            ["This week", stats.week],
            ["This month", stats.month],
            ["All time", stats.all],
          ] as const
        ).map(([label, value]) => (
          <div key={label}>
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="text-sm font-extrabold">{money(value)}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm font-bold">Shift date</Label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-10 w-auto rounded-xl border-2"
        />
      </div>

      {workplace.type === "hourly" ? (
        <div className="flex items-center justify-between">
          <Label className="text-sm font-bold">Hours worked</Label>
          <Stepper value={hours} onChange={setHours} step={0.5} suffix="h" />
        </div>
      ) : workplace.type === "daily" ? (
        <div className="flex items-center justify-between">
          <Label className="text-sm font-bold">Days worked</Label>
          <Stepper value={days} onChange={setDays} step={0.5} suffix="d" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {workplace.treatments.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{money(t.price)} each</p>
              </div>
              <Stepper
                value={counts[t.id] ?? 0}
                onChange={(v) => setCounts((prev) => ({ ...prev, [t.id]: v }))}
              />
            </div>
          ))}
          <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
            <div>
              <p className="text-sm font-bold">Extra minutes</p>
              <p className="text-xs text-muted-foreground">
                {money(EXTRA_MINUTE_RATE)} per minute · 10 min steps
              </p>
            </div>
            <Stepper
              value={extraMinutes}
              onChange={setExtraMinutes}
              step={10}
              suffix=" min"
            />
          </div>
        </div>
      )}


      <div className="flex items-center justify-between rounded-2xl bg-primary/10 px-4 py-3">
        <span className="text-sm font-bold">Shift total</span>
        <span className="text-xl font-extrabold text-primary">{money(total)}</span>
      </div>

      {workplace.billable && invoiceTotal > 0 && (
        <div className="flex items-center justify-between rounded-2xl border-2 border-dashed border-primary/40 px-4 py-2.5">
          <span className="text-sm font-bold">To invoice</span>
          <span className="text-lg font-extrabold">{money(invoiceTotal)}</span>
        </div>
      )}


      <Button className="rounded-full font-extrabold" onClick={save}>
        Save shift
      </Button>
    </Card>
  );
}

function ShiftList({
  shifts,
  workplaces,
  onDelete,
}: {
  shifts: Shift[];
  workplaces: Workplace[];
  onDelete: (id: string) => void;
}) {
  const money = useMoney();
  const [wpFilter, setWpFilter] = useState<string>("all");

  const sorted = [...shifts]
    .filter((s) => wpFilter === "all" || s.workplaceId === wpFilter)
    .sort((a, b) => b.date.localeCompare(a.date));
  const filteredTotal = sorted.reduce((sum, s) => sum + s.total, 0);

  const chips = (
    <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
      {[{ id: "all", name: "All workplaces" }, ...workplaces].map((w) => (
        <button
          key={w.id}
          onClick={() => setWpFilter(w.id)}
          className={cn(
            "shrink-0 rounded-full border-2 px-3 py-1 text-xs font-bold",
            wpFilter === w.id
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-muted-foreground",
          )}
        >
          {w.name}
        </button>
      ))}
    </div>
  );

  if (sorted.length === 0) {
    return (
      <div>
        {chips}
        <div className="rounded-3xl border-2 border-dashed border-border p-8 text-center">
          <p className="font-bold">No shifts yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Log one from the "Log shift" tab.</p>
        </div>
      </div>
    );
  }


  return (
    <div className="flex flex-col gap-2">
      {chips}
      <div className="mb-1 flex items-center justify-between rounded-2xl bg-primary/10 px-4 py-2">
        <span className="text-sm font-bold">
          {wpFilter === "all"
            ? "All workplaces"
            : (workplaces.find((w) => w.id === wpFilter)?.name ?? "Workplace")}{" "}
          · {sorted.length} shift{sorted.length === 1 ? "" : "s"}
        </span>
        <span className="font-extrabold text-primary">{money(filteredTotal)}</span>
      </div>

      {sorted.map((s) => {
        const wp = workplaces.find((w) => w.id === s.workplaceId);
        const detail =
          wp?.type === "hourly"
            ? `${s.hours} hours`
            : wp?.type === "daily"
              ? `${s.days ?? 0} day${(s.days ?? 0) === 1 ? "" : "s"}`
            : [
                ...Object.entries(s.counts)
                  .filter(([, c]) => c > 0)
                  .map(
                    ([id, c]) => `${c} × ${wp?.treatments.find((t) => t.id === id)?.name ?? "?"}`,
                  ),
                ...(s.extraMinutes ? [`${s.extraMinutes} extra min`] : []),
              ].join(", ");

        return (
          <Card key={s.id} className="flex-row items-center justify-between gap-2 border-2 p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold">{wp?.name ?? "Removed workplace"}</p>
              <p className="truncate text-xs text-muted-foreground">
                {new Date(`${s.date}T00:00:00`).toLocaleDateString(getLocale(), {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}{" "}
                · {detail || "—"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-primary">{money(s.total)}</span>
              <button onClick={() => onDelete(s.id)} className="text-muted-foreground">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function AddWorkplaceDialog({ onAdd }: { onAdd: (wp: Workplace) => void }) {
  const { t } = useLanguage();
  const [currency] = useCurrency();
  const symbol = currencySymbol(currency);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"treatment" | "hourly" | "daily">("hourly");
  const [rate, setRate] = useState("70");
  const [treatments, setTreatments] = useState([{ name: "", price: "" }]);
  const [billable, setBillable] = useState(false);
  const [invoiceRate, setInvoiceRate] = useState("");
  const [color, setColor] = useState<SlotColorId>("slot-1");


  function submit() {
    if (!name.trim()) {
      toast.error("Give the workplace a name");
      return;
    }
    const parsedTreatments = treatments
      .filter((t) => t.name.trim() && Number(t.price) > 0)
      .map((t) => ({ id: uid(), name: t.name.trim(), price: Number(t.price) }));

    if (type === "treatment" && parsedTreatments.length === 0) {
      toast.error("Add at least one task with a price");
      return;
    }
    if (type !== "treatment" && !(Number(rate) > 0)) {
      toast.error(type === "daily" ? "Add a day rate" : "Add an hourly rate");
      return;
    }


    onAdd({
      id: uid(),
      name: name.trim(),
      type,
      rate: Number(rate) || 0,
      treatments: type === "treatment" ? parsedTreatments : [],
      removable: true,
      billable,
      color,
      invoiceRate: billable ? Number(invoiceRate) || Number(rate) || 0 : undefined,
    });

    setName("");
    setTreatments([{ name: "", price: "" }]);
    setOpen(false);
    toast.success("Workplace added");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full border-2 border-dashed font-extrabold">
          <Building2 className="mr-2 h-4 w-4" /> Add workplace
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle>New workplace</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="font-bold">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Beach Hotel Spa"
              className="h-11 rounded-xl border-2"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["hourly", "Paid by hour"],
                ["daily", "Paid by day"],
                ["treatment", "Paid by task"],
              ] as const
            ).map(([t, label]) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={cn(
                  "rounded-2xl border-2 px-2 py-3 text-xs font-bold",
                  type === t ? "border-primary bg-primary/10 text-primary" : "border-border",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {type !== "treatment" ? (
            <div className="flex flex-col gap-1.5">
              <Label className="font-bold">
                {type === "daily" ? "Day rate" : "Hourly rate"} ({symbol})
              </Label>
              <Input
                type="number"
                inputMode="decimal"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="h-11 rounded-xl border-2"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Label className="font-bold">Tasks</Label>
              {treatments.map((t, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={t.name}
                    onChange={(e) =>
                      setTreatments((prev) =>
                        prev.map((v, idx) => (idx === i ? { ...v, name: e.target.value } : v)),
                      )
                    }
                    placeholder="Task name"
                    className="h-11 rounded-xl border-2"
                  />
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={t.price}
                    onChange={(e) =>
                      setTreatments((prev) =>
                        prev.map((v, idx) => (idx === i ? { ...v, price: e.target.value } : v)),
                      )
                    }
                    placeholder={symbol}
                    className="h-11 w-24 rounded-xl border-2"
                  />
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="self-start text-primary"
                onClick={() => setTreatments((prev) => [...prev, { name: "", price: "" }])}
              >
                <Plus className="mr-1 h-4 w-4" /> Add task
              </Button>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label className="font-bold">{t("common.colour")}</Label>
            <ColorPicker value={color} onChange={setColor} />
          </div>

          <div className="flex flex-col gap-2 rounded-2xl border-2 border-dashed p-3">
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm font-bold">Freelance — invoice this work</span>
              <input
                type="checkbox"
                checked={billable}
                onChange={(e) => setBillable(e.target.checked)}
                className="h-5 w-5 accent-[hsl(var(--primary))]"
              />
            </label>
            {billable && type === "hourly" && (
              <Input
                type="number"
                inputMode="decimal"
                value={invoiceRate}
                onChange={(e) => setInvoiceRate(e.target.value)}
                placeholder={`Invoice rate per hour (${symbol}) — defaults to ${rate}`}
                className="h-11 rounded-xl border-2"
              />
            )}
          </div>
        </div>


        <DialogFooter>
          <Button className="w-full rounded-full font-extrabold" onClick={submit}>
            Create workplace
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DayHistory({ shifts, workplaces }: { shifts: Shift[]; workplaces: Workplace[] }) {
  const money = useMoney();
  const [day, setDay] = useState(toDateKey(new Date()));

  const dayShifts = shifts.filter((s) => s.date === day);
  const dayTotal = dayShifts.reduce((sum, s) => sum + s.total, 0);

  const shift = (delta: number) => {
    const d = new Date(`${day}T00:00:00`);
    d.setDate(d.getDate() + delta);
    setDay(toDateKey(d));
  };

  const byWorkplace = workplaces
    .map((wp) => ({
      wp,
      total: dayShifts.filter((s) => s.workplaceId === wp.id).reduce((sum, s) => sum + s.total, 0),
    }))
    .filter((row) => row.total > 0);

  return (
    <Card className="gap-3 border-2 p-4">
      <h2 className="text-base font-extrabold">History — look back at any day</h2>

      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="outline"
          className="h-10 w-10 shrink-0 rounded-full border-2"
          onClick={() => shift(-1)}
          aria-label="Previous day"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Input
          type="date"
          value={day}
          onChange={(e) => setDay(e.target.value)}
          className="h-10 flex-1 rounded-xl border-2"
        />
        <Button
          size="icon"
          variant="outline"
          className="h-10 w-10 shrink-0 rounded-full border-2"
          onClick={() => shift(1)}
          aria-label="Next day"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-secondary/15 px-4 py-2">
        <span className="text-sm font-bold">
          {new Date(`${day}T00:00:00`).toLocaleDateString(getLocale(), {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </span>
        <span className="text-lg font-extrabold text-primary">{money(dayTotal)}</span>
      </div>

      {dayShifts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No earnings on this day.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {byWorkplace.map((row) => (
            <div key={row.wp.id} className="flex justify-between text-sm font-bold">
              <span>{row.wp.name}</span>
              <span>{money(row.total)}</span>
            </div>
          ))}
          <div className="mt-1 flex flex-col gap-1 border-t border-border pt-2">
            {dayShifts.map((s) => {
              const wp = workplaces.find((w) => w.id === s.workplaceId);
              const detail =
                wp?.type === "hourly"
                  ? `${s.hours} hours`
                  : wp?.type === "daily"
                    ? `${s.days ?? 0} day${(s.days ?? 0) === 1 ? "" : "s"}`
                  : [
                      ...Object.entries(s.counts)
                        .filter(([, c]) => c > 0)
                        .map(
                          ([id, c]) =>
                            `${c} × ${wp?.treatments.find((t) => t.id === id)?.name ?? "?"}`,
                        ),
                      ...(s.extraMinutes ? [`${s.extraMinutes} extra min`] : []),
                    ].join(", ");
              return (
                <div
                  key={s.id}
                  className="flex justify-between text-xs text-muted-foreground"
                >
                  <span className="truncate">
                    {wp?.name ?? "Removed workplace"} · {detail || "—"}
                  </span>
                  <span className="font-bold">{money(s.total)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

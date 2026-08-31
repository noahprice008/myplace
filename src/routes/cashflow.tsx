import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  Printer,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { useLanguage, getLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { logEvent } from "@/lib/events";
import {
  uid,
  useExpenseCategories,
  useExpenses,
  useFixedCategories,
  useFixedCosts,
  useMoney,
  useShifts,
  useWorkplaces,
  type Expense,
  type FixedCost,
} from "@/lib/store";

export const Route = createFileRoute("/cashflow")({
  head: () => ({
    meta: [
      { title: "myplace — Cashflow" },
      {
        name: "description",
        content:
          "Track income, fixed costs and daily expenses in one income and expenditure statement.",
      },
      { property: "og:title", content: "myplace — Cashflow" },
      {
        property: "og:description",
        content: "A simple income and expenditure statement with CSV and PDF export.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CashflowPage,
});

type Period = "month" | "year";

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

function periodRange(period: Period, offset: number) {
  const now = new Date();
  if (period === "month") {
    const start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    return { start, end: new Date(start.getFullYear(), start.getMonth() + 1, 1) };
  }
  const start = new Date(now.getFullYear() - offset, 0, 1);
  return { start, end: new Date(start.getFullYear() + 1, 0, 1) };
}

function periodLabel(period: Period, offset: number) {
  const { start } = periodRange(period, offset);
  return period === "month"
    ? start.toLocaleDateString(getLocale(), { month: "long", year: "numeric" })
    : String(start.getFullYear());
}

/** Months (yyyy-mm) inside the selected period. */
function monthsInPeriod(period: Period, offset: number) {
  const { start, end } = periodRange(period, offset);
  const out: string[] = [];
  const cursor = new Date(start);
  while (cursor < end) {
    out.push(monthKey(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return out;
}

const fixedActiveIn = (cost: FixedCost, month: string) =>
  (!cost.startMonth || cost.startMonth <= month) && (!cost.endMonth || cost.endMonth >= month);

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? "");
          return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
        })
        .join(","),
    )
    .join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function CashflowPage() {
  const { t } = useLanguage();
  const money = useMoney();
  const [shifts] = useShifts();
  const [workplaces] = useWorkplaces();
  const [fixedCosts, setFixedCosts] = useFixedCosts();
  const [expenses, setExpenses] = useExpenses();
  const [fixedCats, setFixedCats] = useFixedCategories();
  const [expenseCats, setExpenseCats] = useExpenseCategories();

  const [period, setPeriod] = useState<Period>("month");
  const [offset, setOffset] = useState(0);

  const { start, end } = periodRange(period, offset);
  const months = useMemo(() => monthsInPeriod(period, offset), [period, offset]);

  const income = useMemo(() => {
    const byWorkplace: Record<string, number> = {};
    let total = 0;
    for (const s of shifts) {
      const d = new Date(`${s.date}T00:00:00`);
      if (d < start || d >= end) continue;
      byWorkplace[s.workplaceId] = (byWorkplace[s.workplaceId] ?? 0) + s.total;
      total += s.total;
    }
    return { total, byWorkplace };
  }, [shifts, start, end]);

  const fixedRows = useMemo(
    () =>
      fixedCosts.map((cost) => {
        const active = months.filter((m) => fixedActiveIn(cost, m)).length;
        return { cost, months: active, total: active * cost.amount };
      }),
    [fixedCosts, months],
  );
  const fixedTotal = fixedRows.reduce((sum, r) => sum + r.total, 0);

  const periodExpenses = useMemo(
    () =>
      expenses
        .filter((e) => {
          const d = new Date(`${e.date}T00:00:00`);
          return d >= start && d < end;
        })
        .sort((a, b) => b.date.localeCompare(a.date)),
    [expenses, start, end],
  );
  const expenseTotal = periodExpenses.reduce((sum, e) => sum + e.amount, 0);

  const outgoings = fixedTotal + expenseTotal;
  const net = income.total - outgoings;

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of fixedRows) map[r.cost.category] = (map[r.cost.category] ?? 0) + r.total;
    for (const e of periodExpenses) map[e.category] = (map[e.category] ?? 0) + e.amount;
    return Object.entries(map)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1]);
  }, [fixedRows, periodExpenses]);

  const workplaceName = (id: string) =>
    workplaces.find((w) => w.id === id)?.name ?? "Removed workplace";

  function exportCsv() {
    const rows: (string | number)[][] = [
      [`myplace cashflow — ${periodLabel(period, offset)}`],
      [],
      ["Type", "Date / months", "Name", "Category", `Amount (${money.code})`],
    ];
    for (const [id, value] of Object.entries(income.byWorkplace)) {
      rows.push(["Income", periodLabel(period, offset), workplaceName(id), "Earnings", value.toFixed(2)]);
    }
    for (const r of fixedRows) {
      if (r.total <= 0) continue;
      rows.push(["Fixed cost", `${r.months} month(s)`, r.cost.name, r.cost.category, (-r.total).toFixed(2)]);
    }
    for (const e of periodExpenses) {
      rows.push(["Expense", e.date, e.name, e.category, (-e.amount).toFixed(2)]);
    }
    rows.push([], ["Total income", "", "", "", income.total.toFixed(2)]);
    rows.push(["Total fixed costs", "", "", "", fixedTotal.toFixed(2)]);
    rows.push(["Total expenses", "", "", "", expenseTotal.toFixed(2)]);
    rows.push(["Net cashflow", "", "", "", net.toFixed(2)]);
    downloadCsv(`cashflow-${periodLabel(period, offset).replace(/\s+/g, "-").toLowerCase()}.csv`, rows);
    toast.success("CSV exported");
  }

  return (
    <AppShell title={t("title.cash")} subtitle={t("sub.cash")}>
      <div className="mb-4 flex flex-col gap-2 print:hidden">
        <div className="flex gap-1.5">
          {(["month", "year"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => {
                setPeriod(p);
                setOffset(0);
              }}
              className={cn(
                "flex-1 rounded-full border-2 px-3 py-2 text-xs font-extrabold capitalize",
                period === p
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground",
              )}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between rounded-full bg-muted/60 px-1 py-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-full"
            onClick={() => setOffset((o) => o + 1)}
            aria-label="Previous period"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-extrabold">{periodLabel(period, offset)}</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-full"
            disabled={offset === 0}
            onClick={() => setOffset((o) => Math.max(0, o - 1))}
            aria-label="Next period"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <section id="cashflow-statement" className="flex flex-col gap-4">
        <div className="hidden print:block">
          <h2 className="text-lg font-extrabold">
            myplace — income & expenditure, {periodLabel(period, offset)}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card className="gap-1 border-2 border-primary/40 bg-primary/10 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Income
            </p>
            <p className="text-xl font-extrabold text-primary sm:text-2xl">{money(income.total)}</p>
          </Card>
          <Card className="gap-1 border-2 border-destructive/40 bg-destructive/10 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Outgoings
            </p>
            <p className="text-xl font-extrabold text-destructive sm:text-2xl">
              {money(outgoings)}
            </p>
          </Card>
        </div>

        <Card
          className={cn(
            "gap-1 border-2 p-4",
            net >= 0 ? "border-primary/40 bg-secondary/30" : "border-destructive/50 bg-destructive/10",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Net cashflow
            </p>
            {net >= 0 ? (
              <TrendingUp className="h-4 w-4 text-primary" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
          </div>
          <p
            className={cn(
              "text-3xl font-extrabold",
              net >= 0 ? "text-primary" : "text-destructive",
            )}
          >
            {net < 0 ? `-${money(Math.abs(net))}` : money(net)}
          </p>
          <p className="text-xs text-muted-foreground">
            {money(income.total)} in · {money(fixedTotal)} fixed · {money(expenseTotal)} spending
          </p>
        </Card>

        <div className="flex gap-2 print:hidden">
          <Button variant="outline" className="h-11 flex-1 rounded-full font-bold" onClick={exportCsv}>
            <Download className="mr-1.5 h-4 w-4" /> CSV
          </Button>
          <Button
            variant="outline"
            className="h-11 flex-1 rounded-full font-bold"
            onClick={() => window.print()}
          >
            <Printer className="mr-1.5 h-4 w-4" /> Print / PDF
          </Button>
        </div>

        <Card className="gap-3 border-2 p-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wide">Income from work</h3>
          {Object.keys(income.byWorkplace).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No shifts logged in this period — earnings from the Work tab appear here automatically.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {Object.entries(income.byWorkplace)
                .sort((a, b) => b[1] - a[1])
                .map(([id, value]) => (
                  <li key={id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-bold">{workplaceName(id)}</span>
                    <span className="shrink-0 font-extrabold text-primary">{money(value)}</span>
                  </li>
                ))}
              <li className="mt-1 flex items-center justify-between border-t border-border pt-2 text-sm font-extrabold">
                <span>Total</span>
                <span className="text-primary">{money(income.total)}</span>
              </li>
            </ul>
          )}
        </Card>

        {byCategory.length > 0 && (
          <Card className="gap-3 border-2 p-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wide">Where it goes</h3>
            <ul className="flex flex-col gap-2.5">
              {byCategory.map(([cat, value]) => {
                const pct = outgoings > 0 ? (value / outgoings) * 100 : 0;
                return (
                  <li key={cat} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate font-bold">{cat}</span>
                      <span className="shrink-0 text-muted-foreground">
                        {money(value)} · {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </section>

      <Tabs defaultValue="fixed" className="mt-5 print:hidden">
        <TabsList className="mb-4 grid w-full grid-cols-3 rounded-full">
          <TabsTrigger value="fixed" className="rounded-full text-xs font-bold">
            Fixed
          </TabsTrigger>
          <TabsTrigger value="daily" className="rounded-full text-xs font-bold">
            Daily
          </TabsTrigger>
          <TabsTrigger value="categories" className="rounded-full text-xs font-bold">
            Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fixed" className="flex flex-col gap-4">
          <FixedCostForm
            categories={fixedCats}
            onAdd={(cost) => setFixedCosts((prev) => [cost, ...prev])}
          />
          {fixedCosts.length === 0 ? (
            <EmptyNote text="No fixed costs yet. Add rent, electricity, insurance…" />
          ) : (
            <Card className="gap-2 border-2 p-4">
              {fixedRows.map(({ cost, months: activeMonths, total }) => (
                <div
                  key={cost.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border py-2 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold">{cost.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {cost.category} · {money(cost.amount)}/mo · {activeMonths} mo in period
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-extrabold">{money(total)}</span>
                    <button
                      aria-label={`Delete ${cost.name}`}
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setFixedCosts((prev) => prev.filter((c) => c.id !== cost.id))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 text-sm font-extrabold">
                <span>Fixed total</span>
                <span>{money(fixedTotal)}</span>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="daily" className="flex flex-col gap-4">
          <ExpenseForm
            categories={expenseCats}
            onAdd={(expense) => setExpenses((prev) => [expense, ...prev])}
          />
          {periodExpenses.length === 0 ? (
            <EmptyNote text="No purchases recorded in this period yet." />
          ) : (
            <Card className="gap-2 border-2 p-4">
              {periodExpenses.map((e) => (
                <div
                  key={e.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border py-2 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold">{e.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {new Date(`${e.date}T00:00:00`).toLocaleDateString(getLocale(), {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      · {e.category}
                      {e.note ? ` · ${e.note}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-extrabold">{money(e.amount)}</span>
                    <button
                      aria-label={`Delete ${e.name}`}
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setExpenses((prev) => prev.filter((x) => x.id !== e.id))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 text-sm font-extrabold">
                <span>Spending total</span>
                <span>{money(expenseTotal)}</span>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="categories" className="flex flex-col gap-4">
          <CategoryEditor
            title="Fixed cost categories"
            categories={fixedCats}
            onChange={setFixedCats}
          />
          <CategoryEditor
            title="Expense categories"
            categories={expenseCats}
            onChange={setExpenseCats}
          />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function EmptyNote({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function FixedCostForm({
  categories,
  onAdd,
}: {
  categories: string[];
  onAdd: (cost: FixedCost) => void;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(categories[0] ?? "Other");
  const [startMonth, setStartMonth] = useState(monthKey(new Date()));
  const [endMonth, setEndMonth] = useState("");

  return (
    <Card className="gap-3 border-2 p-4">
      <h3 className="text-sm font-extrabold uppercase tracking-wide">Add a fixed cost</h3>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Rent, electricity, phone…"
        className="h-11 rounded-2xl border-2"
      />
      <div className="grid grid-cols-2 gap-2">
        <Input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          placeholder="Amount / month"
          className="h-11 rounded-2xl border-2"
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-11 rounded-2xl border-2 font-bold">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Starts
          <Input
            type="month"
            value={startMonth}
            onChange={(e) => setStartMonth(e.target.value)}
            className="h-11 rounded-2xl border-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Ends (optional)
          <Input
            type="month"
            value={endMonth}
            onChange={(e) => setEndMonth(e.target.value)}
            className="h-11 rounded-2xl border-2"
          />
        </label>
      </div>
      <Button
        className="h-11 rounded-full font-extrabold"
        onClick={() => {
          const value = Number(amount);
          if (!name.trim() || !Number.isFinite(value) || value <= 0) {
            toast.error("Add a name and an amount");
            return;
          }
          onAdd({
            id: uid(),
            name: name.trim(),
            amount: value,
            category,
            startMonth,
            endMonth,
            note: "",
          });
          logEvent("cash", `Fixed cost: ${name.trim()}`, `${value} · ${category}`);
          setName("");
          setAmount("");
          toast.success("Fixed cost added");
        }}
      >
        <Plus className="mr-1 h-4 w-4" /> Add fixed cost
      </Button>
    </Card>
  );
}

function ExpenseForm({
  categories,
  onAdd,
}: {
  categories: string[];
  onAdd: (expense: Expense) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(categories[0] ?? "Other");
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");

  return (
    <Card className="gap-3 border-2 p-4">
      <h3 className="text-sm font-extrabold uppercase tracking-wide">Add a purchase</h3>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="What did you buy?"
        className="h-11 rounded-2xl border-2"
      />
      <div className="grid grid-cols-2 gap-2">
        <Input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          placeholder="Amount"
          className="h-11 rounded-2xl border-2"
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-11 rounded-2xl border-2 font-bold">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-11 rounded-2xl border-2"
        />
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional)"
          className="h-11 rounded-2xl border-2"
        />
      </div>
      <Button
        className="h-11 rounded-full font-extrabold"
        onClick={() => {
          const value = Number(amount);
          if (!name.trim() || !Number.isFinite(value) || value <= 0) {
            toast.error("Add a name and an amount");
            return;
          }
          onAdd({
            id: uid(),
            name: name.trim(),
            amount: value,
            category,
            date,
            note: note.trim(),
          });
          logEvent("cash", `Spent on ${name.trim()}`, `${value} · ${category}`);
          setName("");
          setAmount("");
          setNote("");
          toast.success("Purchase added");
        }}
      >
        <Plus className="mr-1 h-4 w-4" /> Add purchase
      </Button>
    </Card>
  );
}

function CategoryEditor({
  title,
  categories,
  onChange,
}: {
  title: string;
  categories: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  return (
    <Card className="gap-3 border-2 p-4">
      <h3 className="text-sm font-extrabold uppercase tracking-wide">{title}</h3>
      <div className="flex flex-wrap gap-1.5">
        {categories.map((c) => (
          <span
            key={c}
            className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold"
          >
            {c}
            <button
              aria-label={`Remove ${c}`}
              onClick={() => onChange(categories.filter((x) => x !== c))}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        {categories.length === 0 && (
          <span className="text-sm text-muted-foreground">No categories yet.</span>
        )}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="New category"
          className="h-11 rounded-2xl border-2"
        />
        <Button
          className="h-11 shrink-0 rounded-full font-extrabold"
          onClick={() => {
            const value = draft.trim();
            if (!value || categories.includes(value)) return;
            onChange([...categories, value]);
            setDraft("");
          }}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

import { useMemo, useState } from "react";
import { Plus, X, NotebookPen, PiggyBank, CalendarClock, ListChecks } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { logEvent } from "@/lib/events";
import { useLanguage } from "@/lib/i18n";
import {
  uid,
  toDateKey,
  useExpenseCategories,
  useExpenses,
  useMoney,
  usePosts,
  useShifts,
  useWorkplaces,
  type Expense,
  type ListItem,
  type Post,
  type Shift,
} from "@/lib/store";

type Mode = "thought" | "expense" | "hours" | "task";

export function QuickAdd() {
  const { t } = useLanguage();
  const money = useMoney();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("thought");

  const [posts, setPosts] = usePosts();
  const [expenses, setExpenses] = useExpenses();
  const [expenseCats] = useExpenseCategories();
  const [workplaces] = useWorkplaces();
  const [, setShifts] = useShifts();

  const [text, setText] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(expenseCats[0] ?? "Other");
  const [hours, setHours] = useState("");
  const [workplaceId, setWorkplaceId] = useState("");

  const hourlyPlaces = useMemo(() => workplaces.filter((w) => w.type === "hourly"), [workplaces]);
  const activeWorkplace = hourlyPlaces.find((w) => w.id === workplaceId) ?? hourlyPlaces[0];

  const modes: { id: Mode; label: string; icon: typeof Plus; className: string }[] = [
    { id: "thought", label: t("quick.thought"), icon: NotebookPen, className: "bg-primary/15 text-primary" },
    { id: "expense", label: t("quick.expense"), icon: PiggyBank, className: "bg-destructive/15 text-destructive" },
    { id: "hours", label: t("quick.hours"), icon: CalendarClock, className: "bg-secondary text-secondary-foreground" },
    { id: "task", label: t("quick.task"), icon: ListChecks, className: "bg-ocean-aqua/20 text-ocean-deep" },
  ];

  function reset() {
    setText("");
    setAmount("");
    setHours("");
  }

  function close() {
    setOpen(false);
    reset();
  }

  function addPost(post: Post) {
    setPosts([post, ...posts]);
  }

  function save() {
    if (mode === "thought" || mode === "task") {
      const value = text.trim();
      if (!value) {
        toast.error(t("quick.what"));
        return;
      }
      const items: ListItem[] =
        mode === "task" ? [{ id: uid(), text: value, done: false }] : [];
      addPost({
        id: uid(),
        kind: mode === "task" ? "list" : "thought",
        text: mode === "task" ? value : value,
        images: [],
        items,
        likes: 0,
        comments: [],
        createdAt: new Date().toISOString(),
      });
      toast.success(t("quick.added"));
      close();
      return;
    }

    if (mode === "expense") {
      const value = Number(amount);
      if (!value || value <= 0) {
        toast.error(t("quick.amount"));
        return;
      }
      const expense: Expense = {
        id: uid(),
        name: text.trim() || t("quick.expense"),
        amount: value,
        category,
        date: toDateKey(new Date()),
        note: "",
      };
      setExpenses([expense, ...expenses]);
      logEvent("cash", `${money(value)} — ${expense.name}`, category);
      toast.success(t("quick.added"));
      close();
      return;
    }

    const value = Number(hours);
    if (!activeWorkplace) {
      toast.error("Add an hourly workplace in Work first");
      return;
    }
    if (!value || value <= 0) {
      toast.error(t("quick.hoursWorked"));
      return;
    }
    const total = value * activeWorkplace.rate;
    const shift: Shift = {
      id: uid(),
      workplaceId: activeWorkplace.id,
      date: toDateKey(new Date()),
      hours: value,
      days: 0,
      counts: {},
      extraMinutes: 0,
      total,
      note: text.trim(),
    };
    setShifts((prev) => [shift, ...prev]);
    logEvent("work", `${value}h at ${activeWorkplace.name}`, money(total));
    toast.success(t("quick.added"));
    close();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("quick.title")}
        className="fixed bottom-[calc(72px+env(safe-area-inset-bottom))] end-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95 print:hidden sm:end-[max(1rem,calc(50%-15rem))]"
      >
        <Plus className="h-7 w-7" />
      </button>

      <Sheet open={open} onOpenChange={(v) => (v ? setOpen(true) : close())}>
        <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-3xl border-2 px-4 pb-8">
          <SheetHeader className="px-0">
            <SheetTitle className="text-lg font-extrabold">{t("quick.title")}</SheetTitle>
          </SheetHeader>

          <div className="grid grid-cols-2 gap-2">
            {modes.map((m) => {
              const Icon = m.icon;
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-2xl border-2 px-3 py-3 text-sm font-extrabold transition-colors",
                    active ? "border-primary " + m.className : "border-border text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {m.label}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {mode === "expense" && (
              <>
                <Input
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={t("quick.amount")}
                  className="h-12 rounded-2xl border-2 text-lg font-extrabold"
                  autoFocus
                />
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-11 rounded-2xl border-2 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCats.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}

            {mode === "hours" && (
              <>
                <Input
                  inputMode="decimal"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder={t("quick.hoursWorked")}
                  className="h-12 rounded-2xl border-2 text-lg font-extrabold"
                  autoFocus
                />
                {hourlyPlaces.length > 1 && (
                  <Select
                    value={activeWorkplace?.id ?? ""}
                    onValueChange={setWorkplaceId}
                  >
                    <SelectTrigger className="h-11 rounded-2xl border-2 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {hourlyPlaces.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </>
            )}

            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("quick.what")}
              className="min-h-16 resize-none rounded-2xl border-2 text-base"
              autoFocus={mode === "thought" || mode === "task"}
            />

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-full" onClick={close}>
                <X className="mr-1 h-4 w-4" />
                {t("quick.cancel")}
              </Button>
              <Button className="flex-1 rounded-full font-extrabold" onClick={save}>
                {t("quick.save")}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

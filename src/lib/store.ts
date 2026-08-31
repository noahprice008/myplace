import { useCallback, useEffect, useMemo, useState } from "react";

/* ---------------- Types ---------------- */

export type PostKind = "thought" | "note" | "diary" | "list" | "memo";

export type Comment = {
  id: string;
  text: string;
  createdAt: string;
};

export type ListItem = {
  id: string;
  text: string;
  done: boolean;
};

export type Post = {
  id: string;
  kind: PostKind;
  text: string;
  images: string[];
  items: ListItem[];
  likes: number;
  comments: Comment[];
  createdAt: string;
  /** Base64 data URL of a recorded voice memo. */
  audio?: string;
  /** Voice memo length in seconds. */
  audioSeconds?: number;
  /** Emoji mood/reaction sticker. */
  mood?: string;
};

export type Treatment = {
  id: string;
  name: string;
  price: number;
};

export type Workplace = {
  id: string;
  name: string;
  type: "treatment" | "hourly" | "daily";
  rate: number; // hourly rate (type "hourly") or day rate (type "daily")
  treatments: Treatment[];
  removable: boolean;
  /** Freelance work that can be invoiced. */
  billable?: boolean;
  /** Rate used for invoicing; falls back to `rate`. */
  invoiceRate?: number;
  /** Palette colour id used on the schedule. */
  color?: SlotColorId;
};

/* ---------------- Schedule colour palette ---------------- */

export type SlotColorId =
  | "slot-1" | "slot-2" | "slot-3" | "slot-4" | "slot-5"
  | "slot-6" | "slot-7" | "slot-8" | "slot-9" | "slot-10";

export const SLOT_COLORS: { id: SlotColorId; dot: string; cell: string }[] = [
  { id: "slot-1", dot: "bg-slot-1", cell: "border-slot-1 bg-slot-1/70" },
  { id: "slot-2", dot: "bg-slot-2", cell: "border-slot-2 bg-slot-2/70" },
  { id: "slot-3", dot: "bg-slot-3", cell: "border-slot-3 bg-slot-3/70" },
  { id: "slot-4", dot: "bg-slot-4", cell: "border-slot-4 bg-slot-4/70" },
  { id: "slot-5", dot: "bg-slot-5", cell: "border-slot-5 bg-slot-5/70" },
  { id: "slot-6", dot: "bg-slot-6", cell: "border-slot-6 bg-slot-6/70" },
  { id: "slot-7", dot: "bg-slot-7", cell: "border-slot-7 bg-slot-7/70" },
  { id: "slot-8", dot: "bg-slot-8", cell: "border-slot-8 bg-slot-8/70" },
  { id: "slot-9", dot: "bg-slot-9", cell: "border-slot-9 bg-slot-9/70" },
  { id: "slot-10", dot: "bg-slot-10", cell: "border-slot-10 bg-slot-10/70" },
];

export const slotColor = (id: SlotColorId | undefined) =>
  SLOT_COLORS.find((c) => c.id === id) ?? SLOT_COLORS[0];

/** Colours for the fixed (non-workplace) schedule slot kinds. */
export type FixedSlotColors = { personal: SlotColorId; other: SlotColorId; unavailable: SlotColorId };

export const DEFAULT_FIXED_SLOT_COLORS: FixedSlotColors = {
  personal: "slot-9",
  other: "slot-5",
  unavailable: "slot-7",
};

export const useSlotColors = () =>
  usePersistentState<FixedSlotColors>("slot-colors", DEFAULT_FIXED_SLOT_COLORS);



export type Shift = {
  id: string;
  workplaceId: string;
  date: string; // yyyy-mm-dd
  hours: number;
  days?: number; // days worked, used when workplace type === "daily"
  counts: Record<string, number>; // treatmentId -> count
  extraMinutes?: number; // extra minutes billed at EXTRA_MINUTE_RATE
  total: number;
  note: string;
};

export type Appointment = {
  id: string;
  title: string;
  date: string; // yyyy-mm-dd
  time: string; // HH:mm or ""
  note: string;
};

export const EXTRA_MINUTE_RATE = 2;

/**
 * Schedule slot ids used to colour the weekly grid.
 * Either a workplace id, one of the fixed kinds, or a legacy value.
 */
export type JobId = string;

/** key: `${weekStartISO}` -> map of `${dayIndex}-${hour}` -> JobId */
export type Availability = Record<string, Record<string, JobId>>;

/** key: `${weekStartISO}` -> locked */
export type ScheduleLocks = Record<string, boolean>;

/* ---------------- Cashflow ---------------- */

export type FixedCost = {
  id: string;
  name: string;
  amount: number;
  category: string;
  /** yyyy-mm of the first month this cost applies to */
  startMonth: string;
  /** yyyy-mm of the last month (inclusive), empty = ongoing */
  endMonth: string;
  note: string;
};

export type Expense = {
  id: string;
  name: string;
  amount: number;
  category: string;
  date: string; // yyyy-mm-dd
  note: string;
};

export type ProPlan = "free" | "monthly" | "yearly";

export type ProStatus = {
  plan: ProPlan;
  since: string;
};



/* ---------------- Helpers ---------------- */

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const toDateKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const CURRENCIES = [
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "ILS", symbol: "₪", label: "Israeli Shekel" },
  { code: "CAD", symbol: "C$", label: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar" },
  { code: "INR", symbol: "₹", label: "Indian Rupee" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export const currencySymbol = (code: string) =>
  CURRENCIES.find((c) => c.code === code)?.symbol ?? "$";

export const formatMoney = (n: number, code: string) =>
  `${currencySymbol(code)}${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

export const useCurrency = () => usePersistentState<string>("currency", "USD");

/** Formatter bound to the saved currency. */
export function useMoney() {
  const [code] = useCurrency();
  return useMemo(() => Object.assign((n: number) => formatMoney(n, code), { code }), [code]);
}

export const shekels = (n: number) =>
  `₪${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

export const DEFAULT_WORKPLACES: Workplace[] = [];

/* ---------------- Persisted state hook ---------------- */

const PREFIX = "myplace:";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setValue(read<T>(key, initial));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* quota exceeded — ignore */
    }
  }, [key, value, hydrated]);

  const update = useCallback((updater: T | ((prev: T) => T)) => {
    setValue((prev) => (typeof updater === "function" ? (updater as (p: T) => T)(prev) : updater));
  }, []);

  return [value, update, hydrated] as const;
}

export const usePosts = () => usePersistentState<Post[]>("posts", []);
export const useWorkplaces = () => usePersistentState<Workplace[]>("workplaces", DEFAULT_WORKPLACES);
export const useShifts = () => usePersistentState<Shift[]>("shifts", []);
export const useAppointments = () => usePersistentState<Appointment[]>("appointments", []);

/** Migrate the original list of available slots into a neutral workplace label. */
function migrateAvailability(raw: unknown): Availability {
  const out: Availability = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [week, value] of Object.entries(raw as Record<string, unknown>)) {
    if (Array.isArray(value)) {
      const map: Record<string, JobId> = {};
      for (const slot of value) if (typeof slot === "string") map[slot] = "workplace1";
      out[week] = map;
    } else if (value && typeof value === "object") {
      out[week] = value as Record<string, JobId>;
    }
  }
  return out;
}

export function useAvailability() {
  const [value, setValue, hydrated] = usePersistentState<Availability>("availability", {});
  const migrated = useMemo(() => migrateAvailability(value), [value]);
  return [migrated, setValue, hydrated] as const;
}


export const useScheduleLocks = () => usePersistentState<ScheduleLocks>("schedule-locks", {});

export type ScheduleHours = { start: number; end: number };

/** Displayed schedule range; slots run from start to end-1 (end is exclusive). */
export const useScheduleHours = () =>
  usePersistentState<ScheduleHours>("schedule-hours", { start: 8, end: 17 });

/* ---------------- Cashflow hooks ---------------- */

export const DEFAULT_FIXED_CATEGORIES = ["Housing", "Utilities", "Insurance", "Subscriptions"];
export const DEFAULT_EXPENSE_CATEGORIES = ["Groceries", "Transport", "Eating out", "Health", "Other"];

export const useFixedCosts = () => usePersistentState<FixedCost[]>("fixed-costs", []);
export const useExpenses = () => usePersistentState<Expense[]>("expenses", []);
export const useFixedCategories = () =>
  usePersistentState<string[]>("fixed-categories", DEFAULT_FIXED_CATEGORIES);
export const useExpenseCategories = () =>
  usePersistentState<string[]>("expense-categories", DEFAULT_EXPENSE_CATEGORIES);

/** Mock subscription state — swap for a real provider later. */
export const useProStatus = () =>
  usePersistentState<ProStatus>("pro-status", { plan: "free", since: "" });

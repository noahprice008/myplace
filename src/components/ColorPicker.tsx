import { Check, ChevronDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SLOT_COLORS, slotColor, type SlotColorId } from "@/lib/store";
import { cn } from "@/lib/utils";

/**
 * Compact colour chooser: a single dot-and-chevron trigger that opens a
 * swatch grid, so a colour field costs one line instead of a whole row.
 */
export function ColorPicker({
  value,
  onChange,
  label,
}: {
  value: SlotColorId | undefined;
  onChange: (c: SlotColorId) => void;
  label?: string;
}) {
  const current = slotColor(value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={label ?? "Colour"}
          className="flex h-9 min-h-9 min-w-9 items-center gap-1.5 rounded-full border-2 border-border bg-background px-2 transition-colors hover:bg-accent"
        >
          <span className={cn("h-4 w-4 rounded-full", current.dot)} />
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-auto rounded-2xl p-2">
        <div className="grid grid-cols-5 gap-1.5">
          {SLOT_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-label={c.id}
              onClick={() => onChange(c.id)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-transform",
                c.dot,
                value === c.id ? "scale-110 border-foreground" : "border-transparent",
              )}
            >
              {value === c.id ? <Check className="h-4 w-4 text-background" /> : null}
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

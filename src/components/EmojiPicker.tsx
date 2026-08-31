import { ChevronDown, Smile, X } from "lucide-react";
import { useMemo, useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePersistentState } from "@/lib/store";
import { cn } from "@/lib/utils";

type Group = { id: string; icon: string; emojis: string[] };

export const EMOJI_GROUPS: Group[] = [
  {
    id: "mood",
    icon: "😀",
    emojis: ["😀","😄","😊","🙂","😌","🥰","😍","🤗","😎","🤩","😴","😐","😕","😢","😭","😤","😠","😳","🤯","🥺","🙃","😬","🤔","🥱"],
  },
  {
    id: "energy",
    icon: "🔥",
    emojis: ["🔥","⚡","💪","🚀","✨","💡","🎯","🏆","📈","⭐","🧠","🧘","🏃","😮‍💨","🛌","☕"],
  },
  {
    id: "love",
    icon: "❤️",
    emojis: ["❤️","🧡","💛","💚","💙","💜","🤍","🖤","💖","💔","🫶","🤝","👏","🙏","👀","💐"],
  },
  {
    id: "work",
    icon: "💼",
    emojis: ["💼","💻","📝","📚","🧾","💰","💵","🧹","🔧","🩺","💅","✂️","🚗","📞","📅","✅"],
  },
  {
    id: "life",
    icon: "🍕",
    emojis: ["🍕","🍔","🥗","🍎","🍰","🍫","🍷","🍺","🧋","🍳","🛒","🎁","🎵","🎬","🎮","🐶","🐱","🌱"],
  },
  {
    id: "travel",
    icon: "✈️",
    emojis: ["✈️","🏖️","🏔️","🏕️","🚆","🚌","🚲","🗺️","🏠","🏥","🏫","⛱️","🌍","🧳"],
  },
  {
    id: "weather",
    icon: "☀️",
    emojis: ["☀️","🌤️","⛅","🌧️","⛈️","❄️","🌈","🌙","🌊","🍂","🌸","🌡️"],
  },
  {
    id: "party",
    icon: "🎉",
    emojis: ["🎉","🥳","🎂","🎈","🍾","🎊","🎇","💯","🙌","🏅","💍","👶"],
  },
];

export function EmojiPicker({
  value,
  onChange,
  label,
}: {
  value: string | undefined;
  onChange: (emoji: string | undefined) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState(EMOJI_GROUPS[0].id);
  const [recent, setRecent] = usePersistentState<string[]>("recent-emojis", []);

  const emojis = useMemo(
    () => EMOJI_GROUPS.find((g) => g.id === group)?.emojis ?? [],
    [group],
  );

  function pick(e: string) {
    if (value === e) {
      onChange(undefined);
      setOpen(false);
      return;
    }
    onChange(e);
    setRecent((prev) => [e, ...prev.filter((x) => x !== e)].slice(0, 10));
    setOpen(false);
  }

  return (
    <div className="mb-3 flex items-center gap-2">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={label}
            className="flex h-9 min-h-9 items-center gap-1.5 rounded-full border-2 border-border bg-background px-2.5 transition-colors hover:bg-accent"
          >
            {value ? (
              <span className="text-lg leading-none">{value}</span>
            ) : (
              <Smile className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              {label}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-[19rem] max-w-[calc(100vw-2rem)] rounded-2xl p-2">
          {recent.length > 0 && (
            <div className="mb-1.5 flex gap-1 overflow-x-auto pb-1">
              {recent.map((e) => (
                <button
                  key={`recent-${e}`}
                  type="button"
                  onClick={() => pick(e)}
                  aria-label={e}
                  aria-pressed={value === e}
                  className={cn(
                    "min-h-9 min-w-9 shrink-0 rounded-full border-2 text-lg leading-none transition-transform",
                    value === e ? "scale-110 border-primary bg-primary/10" : "border-transparent",
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          )}

          <div className="mb-1.5 flex gap-1 overflow-x-auto pb-1">
            {EMOJI_GROUPS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGroup(g.id)}
                aria-label={g.id}
                aria-pressed={group === g.id}
                className={cn(
                  "min-h-8 min-w-8 shrink-0 rounded-full border-2 text-base leading-none",
                  group === g.id ? "border-primary bg-primary/10" : "border-border opacity-70",
                )}
              >
                {g.icon}
              </button>
            ))}
          </div>

          <div className="grid max-h-44 grid-cols-8 gap-1 overflow-y-auto">
            {emojis.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => pick(e)}
                aria-label={e}
                aria-pressed={value === e}
                className={cn(
                  "flex min-h-9 items-center justify-center rounded-xl border-2 text-lg leading-none transition-transform",
                  value === e ? "scale-110 border-primary bg-primary/10" : "border-transparent",
                )}
              >
                {e}
              </button>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {value ? (
        <button
          type="button"
          onClick={() => onChange(undefined)}
          aria-label="Clear"
          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-border text-muted-foreground transition-colors hover:bg-accent"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

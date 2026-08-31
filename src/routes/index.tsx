import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  ImagePlus,
  Trash2,
  Search,
  Plus,
  X,
  Send,
  Pencil,
  CopyPlus,

  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { EventCard } from "@/components/EventCard";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { EmojiPicker } from "@/components/EmojiPicker";
import { useWallEvents, type WallEvent } from "@/lib/events";




import { AppShell } from "@/components/AppShell";
import { useLanguage, getLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fileToCompressedDataUrl } from "@/lib/image";
import { SHARE_TARGETS, canNativeShare, openShareWindow, shareUrl } from "@/lib/share";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePosts, uid, type Post, type PostKind, type ListItem } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "myplace — Wall" },
      {
        name: "description",
        content: "Your personal wall for thoughts, photos, notes, journal entries and lists.",
      },
      { property: "og:title", content: "myplace — Wall" },
      {
        property: "og:description",
        content: "Your personal wall for thoughts, photos, notes, journal entries and lists.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WallPage,
});

const KINDS: { id: PostKind; label: string; className: string }[] = [
  { id: "thought", label: "Thought", className: "bg-primary/15 text-primary" },
  { id: "note", label: "Note", className: "bg-secondary text-secondary-foreground" },
  { id: "diary", label: "Journal", className: "bg-destructive/15 text-destructive" },
  { id: "list", label: "List", className: "bg-ocean-aqua/20 text-ocean-deep" },
];


const kindMeta = (kind: PostKind) => KINDS.find((k) => k.id === kind) ?? KINDS[0];

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return "Today";
  if (same(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString(getLocale(), { weekday: "long", day: "numeric", month: "long" });
}

const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString(getLocale(), { hour: "2-digit", minute: "2-digit" });

type Period = "week" | "month" | "year";

const PERIODS: { id: Period; label: string }[] = [
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
];

/** Start (inclusive) and end (exclusive) of the period `offset` steps back from now. */
function periodRange(period: Period, offset: number) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  let start: Date;
  let end: Date;
  if (period === "week") {
    start = new Date(now);
    start.setDate(start.getDate() - start.getDay() - offset * 7);
    end = new Date(start);
    end.setDate(end.getDate() + 7);
  } else if (period === "month") {
    start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  } else {
    start = new Date(now.getFullYear() - offset, 0, 1);
    end = new Date(start.getFullYear() + 1, 0, 1);
  }
  return { start, end };
}

function periodLabel(period: Period, offset: number) {
  const { start, end } = periodRange(period, offset);
  if (period === "week") {
    const last = new Date(end);
    last.setDate(last.getDate() - 1);
    if (offset === 0) return "This week";
    if (offset === 1) return "Last week";
    return `${start.toLocaleDateString(getLocale(), { day: "numeric", month: "short" })} – ${last.toLocaleDateString(getLocale(), { day: "numeric", month: "short" })}`;
  }
  if (period === "month")
    return start.toLocaleDateString(getLocale(), { month: "long", year: "numeric" });
  return String(start.getFullYear());
}

function WallPage() {
  const { t } = useLanguage();
  const [posts, setPosts] = usePosts();
  const [kind, setKind] = useState<PostKind>("thought");
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [listDraft, setListDraft] = useState<string[]>([""]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<PostKind | "all">("all");
  const [period, setPeriod] = useState<Period>("week");
  const [periodOffset, setPeriodOffset] = useState(0);
  const [visible, setVisible] = useState(15);
  const [audio, setAudio] = useState<string | undefined>();
  const [audioSeconds, setAudioSeconds] = useState(0);
  const [mood, setMood] = useState<string | undefined>();
  const [showEvents, setShowEvents] = useState(true);
  const { events, remove: removeEvent } = useWallEvents();
  const fileRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);


  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const { start, end } = periodRange(period, periodOffset);
    return posts
      .filter((p) => {
        const d = new Date(p.createdAt);
        return d >= start && d < end;
      })
      .filter((p) => (filter === "all" ? true : p.kind === filter))
      .filter(
        (p) =>
          !q ||
          p.text.toLowerCase().includes(q) ||
          p.items.some((i) => i.text.toLowerCase().includes(q)),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [posts, filter, query, period, periodOffset]);

  const filteredEvents = useMemo(() => {
    if (!showEvents || filter !== "all") return [];
    const q = query.trim().toLowerCase();
    const { start, end } = periodRange(period, periodOffset);
    return events
      .filter((e) => {
        const d = new Date(e.createdAt);
        return d >= start && d < end;
      })
      .filter(
        (e) =>
          !q || e.title.toLowerCase().includes(q) || e.detail.toLowerCase().includes(q),
      );
  }, [events, showEvents, filter, query, period, periodOffset]);

  type Entry = { at: string } & ({ t: "post"; post: Post } | { t: "event"; event: WallEvent });

  const timeline = useMemo<Entry[]>(
    () =>
      [
        ...filtered.map((post) => ({ t: "post" as const, post, at: post.createdAt })),
        ...filteredEvents.map((event) => ({ t: "event" as const, event, at: event.createdAt })),
      ].sort((a, b) => b.at.localeCompare(a.at)),
    [filtered, filteredEvents],
  );

  const shown = timeline.slice(0, visible);

  const groups = useMemo(() => {
    const map: { label: string; entries: Entry[] }[] = [];
    for (const entry of shown) {
      const label = dayLabel(entry.at);
      const last = map[map.length - 1];
      if (last && last.label === label) last.entries.push(entry);
      else map.push({ label, entries: [entry] });
    }
    return map;
  }, [shown]);


  function startEdit(post: Post) {
    setEditingId(post.id);
    setKind(post.kind);
    setText(post.text);
    setImages(post.images);
    setListDraft(post.items.length ? post.items.map((i) => i.text) : [""]);
    setAudio(post.audio);
    setAudioSeconds(post.audioSeconds ?? 0);
    setMood(post.mood);

    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function duplicate(post: Post) {
    const copy: Post = {
      ...post,
      id: uid(),
      items: post.items.map((i) => ({ id: uid(), text: i.text, done: false })),
      images: [...post.images],
      likes: 0,
      comments: [],
      createdAt: new Date().toISOString(),
    };
    setPosts((prev) => [copy, ...prev]);
    toast.success("List duplicated");
  }


  function resetComposer() {
    setEditingId(null);
    setText("");
    setImages([]);
    setListDraft([""]);
    setAudio(undefined);
    setAudioSeconds(0);
    setMood(undefined);
  }



  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const next: string[] = [];
    for (const file of Array.from(files).slice(0, 4)) {
      next.push(await fileToCompressedDataUrl(file));
    }
    setImages((prev) => [...prev, ...next].slice(0, 4));
  }

  function publish() {
    const existing = editingId ? posts.find((p) => p.id === editingId) : undefined;
    const items: ListItem[] =
      kind === "list"
        ? listDraft
            .map((t) => t.trim())
            .filter(Boolean)
            .map((t, i) => ({
              id: existing?.items[i]?.id ?? uid(),
              text: t,
              done: existing?.items[i]?.done ?? false,
            }))
        : [];

    if (!text.trim() && images.length === 0 && items.length === 0 && !audio && !mood) {
      toast.error("Write something first 🙂");
      return;
    }

    if (existing) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === existing.id
            ? { ...p, kind, text: text.trim(), images, items, audio, audioSeconds, mood }
            : p,
        ),
      );
      resetComposer();
      toast.success("Post updated");
      return;
    }

    const post: Post = {
      id: uid(),
      kind,
      text: text.trim(),
      images,
      items,
      likes: 0,
      comments: [],
      createdAt: new Date().toISOString(),
      audio,
      audioSeconds,
      mood,
    };

    setPosts((prev) => [post, ...prev]);
    resetComposer();
    toast.success("Posted to your wall!");
  }

  const update = (id: string, fn: (p: Post) => Post) =>
    setPosts((prev) => prev.map((p) => (p.id === id ? fn(p) : p)));

  return (
    <AppShell title={t("title.wall")} subtitle={t("sub.wall")}>
      <Card ref={composerRef} className="mb-5 gap-3 border-2 p-4">
        {editingId && (
          <div className="flex items-center justify-between rounded-2xl bg-secondary px-3 py-2">
            <span className="text-xs font-extrabold">Editing post</span>
            <Button size="sm" variant="ghost" className="h-7 rounded-full" onClick={resetComposer}>
              Cancel
            </Button>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {KINDS.map((k) => (
            <button
              key={k.id}
              onClick={() => setKind(k.id)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-bold transition-colors",
                kind === k.id ? k.className : "bg-muted/60 text-muted-foreground",
              )}
            >
              {k.label}
            </button>
          ))}
        </div>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            kind === "diary"
              ? "Dear journal…"
              : kind === "list"
                ? "Give your list a title…"
                : "What's on your mind?"
          }
          className="min-h-20 resize-none rounded-2xl border-2 text-base"
        />


        {kind === "list" && (
          <div className="flex flex-col gap-2">
            {listDraft.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                <Input
                  value={item}
                  onChange={(e) =>
                    setListDraft((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
                  }
                  placeholder={`Item ${i + 1}`}
                  className="h-10 rounded-xl border-2"
                />
                {listDraft.length > 1 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setListDraft((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="self-start text-primary"
              onClick={() => setListDraft((prev) => [...prev, ""])}
            >
              <Plus className="mr-1 h-4 w-4" /> Add item
            </Button>
          </div>
        )}

        {images.length > 0 && (
          <div className="flex gap-2 overflow-x-auto">
            {images.map((src, i) => (
              <div key={i} className="relative shrink-0">
                <img
                  src={src}
                  alt="Attachment preview"
                  loading="lazy"
                  className="h-20 w-20 rounded-xl object-cover"
                />
                <button
                  onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute -right-1.5 -top-1.5 rounded-full bg-destructive p-1 text-primary-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {audio && (
          <div className="mb-3">
            <VoiceRecorder
              value={audio}
              seconds={audioSeconds}
              onChange={(a, s) => {
                setAudio(a);
                setAudioSeconds(s);
              }}
            />
          </div>
        )}

        <EmojiPicker value={mood} onChange={setMood} label={t("wall.mood")} />

        <div className="flex items-center justify-between gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              void handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <Button variant="outline" className="rounded-full" onClick={() => fileRef.current?.click()}>
            <ImagePlus className="mr-1.5 h-4 w-4" /> {t("wall.photo")}
          </Button>
          {!audio && (
            <VoiceRecorder
              onChange={(a, s) => {
                setAudio(a);
                setAudioSeconds(s);
              }}
            />
          )}
          <Button className="rounded-full px-6 font-extrabold" onClick={publish}>
            {editingId ? "Save changes" : "Post"}
          </Button>

        </div>

      </Card>

      <div className="mb-4 flex flex-col gap-2">
        <div className="flex gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setPeriod(p.id);
                setPeriodOffset(0);
              }}
              className={cn(
                "flex-1 rounded-full border-2 px-3 py-1.5 text-xs font-extrabold",
                period === p.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between rounded-full bg-muted/60 px-1 py-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full"
            onClick={() => setPeriodOffset((o) => o + 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-extrabold">{periodLabel(period, periodOffset)}</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full"
            disabled={periodOffset === 0}
            onClick={() => setPeriodOffset((o) => Math.max(0, o - 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the wall"
            className="h-11 rounded-full border-2 pl-9"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setShowEvents((v) => !v)}
            className={cn(
              "shrink-0 rounded-full border-2 px-3 py-1 text-xs font-bold",
              showEvents
                ? "border-ocean-aqua bg-ocean-aqua/20 text-ocean-deep"
                : "border-border text-muted-foreground",
            )}
          >
            ⚡ Activity
          </button>

          {(["all", ...KINDS.map((k) => k.id)] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "shrink-0 rounded-full border-2 px-3 py-1 text-xs font-bold",
                filter === f
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground",
              )}
            >
              {f === "all" ? "All" : kindMeta(f).label}
            </button>
          ))}
        </div>
      </div>

      {timeline.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border p-8 text-center">
          <p className="font-bold">Nothing in this {period}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try another {period} or post something new.
          </p>
        </div>

      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <section key={group.label} className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-extrabold uppercase tracking-wide">
                  {group.label}
                </span>
                <div className="h-0.5 flex-1 brand-stripe opacity-40" />
              </div>
              {group.entries.map((entry) =>
                entry.t === "event" ? (
                  <EventCard
                    key={entry.event.id}
                    event={entry.event}
                    onDismiss={() => removeEvent(entry.event.id)}
                  />
                ) : (
                  <PostCard
                    key={entry.post.id}
                    post={entry.post}
                    onUpdate={(fn) => update(entry.post.id, fn)}
                    onEdit={() => startEdit(entry.post)}
                    onDuplicate={() => duplicate(entry.post)}
                    onDelete={() =>
                      setPosts((prev) => prev.filter((p) => p.id !== entry.post.id))
                    }
                  />
                ),
              )}

            </section>
          ))}

          {visible < timeline.length && (

            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setVisible((v) => v + 15)}
            >
              Show earlier days
            </Button>
          )}
        </div>
      )}
    </AppShell>
  );
}

function PostCard({
  post,
  onUpdate,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  post: Post;
  onUpdate: (fn: (p: Post) => Post) => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {


  const [openComments, setOpenComments] = useState(false);
  const [comment, setComment] = useState("");
  const meta = kindMeta(post.kind);

  const shareText = [post.text, ...post.items.map((i) => `• ${i.text}`)]
    .filter(Boolean)
    .join("\n") || "A post from myplace";

  async function nativeShare() {
    try {
      await navigator.share({ title: "From myplace", text: shareText, url: shareUrl() });
    } catch {
      /* user cancelled */
    }
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl()}`);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Couldn't copy");
    }
  }


  return (
    <Card className="gap-3 border-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-extrabold", meta.className)}>
            {meta.label}
          </span>
          <span className="text-xs text-muted-foreground">{timeLabel(post.createdAt)}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onEdit}
            aria-label="Edit post"
            className="text-muted-foreground hover:text-primary"
          >
            <Pencil className="h-4 w-4" />
          </button>
          {post.kind === "list" && (
            <button
              onClick={onDuplicate}
              aria-label="Duplicate list"
              className="text-muted-foreground hover:text-primary"
            >
              <CopyPlus className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={onDelete}
            aria-label="Delete post"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

      </div>

      {post.mood && (
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xl">
            {post.mood}
          </span>
        </div>
      )}

      {post.text && <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{post.text}</p>}

      {post.audio && (
        <audio controls src={post.audio} className="h-10 w-full rounded-full" />
      )}



      {post.items.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {post.items.map((item) => (
            <li key={item.id}>
              <button
                onClick={() =>
                  onUpdate((p) => ({
                    ...p,
                    items: p.items.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)),
                  }))
                }
                className="flex w-full items-center gap-2 text-left"
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2",
                    item.done ? "border-primary bg-primary" : "border-border",
                  )}
                >
                  {item.done && <span className="text-[11px] text-primary-foreground">✓</span>}
                </span>
                <span className={cn("text-sm", item.done && "text-muted-foreground line-through")}>
                  {item.text}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {post.images.length > 0 && (
        <div className={cn("grid gap-2", post.images.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
          {post.images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt="myplace wall post"
              loading="lazy"
              className="max-h-72 w-full rounded-2xl object-cover"
            />
          ))}
        </div>
      )}

      <div className="flex items-center gap-1 border-t border-border pt-2">
        <Button
          variant="ghost"
          size="sm"
          className={cn("flex-1 rounded-full", post.likes > 0 && "text-destructive")}
          onClick={() => onUpdate((p) => ({ ...p, likes: p.likes + 1 }))}
        >
          <Heart className={cn("mr-1 h-4 w-4", post.likes > 0 && "fill-current")} />
          {post.likes > 0 ? post.likes : "Like"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 rounded-full"
          onClick={() => setOpenComments((v) => !v)}
        >
          <MessageCircle className="mr-1 h-4 w-4" />
          {post.comments.length > 0 ? post.comments.length : "Comment"}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex-1 rounded-full">
              <Share2 className="mr-1 h-4 w-4" /> Share
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-2xl">
            {canNativeShare() && (
              <>
                <DropdownMenuItem onSelect={() => void nativeShare()}>
                  Share via device…
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {SHARE_TARGETS.map((target) => (
              <DropdownMenuItem
                key={target.id}
                onSelect={() => {
                  const href = target.build(shareText, shareUrl());
                  if (target.id === "email") window.location.href = href;
                  else openShareWindow(href);
                }}
              >
                {target.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void copyText()}>Copy text & link</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>

      {openComments && (
        <div className="flex flex-col gap-2 rounded-2xl bg-muted/50 p-3">
          {post.comments.map((c) => (
            <div key={c.id} className="rounded-xl bg-card px-3 py-2">
              <p className="text-sm">{c.text}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{timeLabel(c.createdAt)}</p>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment…"
              className="h-10 rounded-full border-2"
            />
            <Button
              size="icon"
              className="h-10 w-10 shrink-0 rounded-full"
              onClick={() => {
                if (!comment.trim()) return;
                onUpdate((p) => ({
                  ...p,
                  comments: [
                    ...p.comments,
                    { id: uid(), text: comment.trim(), createdAt: new Date().toISOString() },
                  ],
                }));
                setComment("");
              }}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

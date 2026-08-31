import { useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

const MAX_SECONDS = 60;

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

export function VoiceRecorder({
  value,
  seconds,
  onChange,
}: {
  value?: string;
  seconds?: number;
  onChange: (audio: string | undefined, seconds: number) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  function stop() {
    recorderRef.current?.stop();
  }

  async function start() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      toast.error("Recording isn't supported on this device");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      let count = 0;

      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        setRecording(false);
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => onChange(String(reader.result), count);
        reader.readAsDataURL(blob);
      };

      recorderRef.current = rec;
      rec.start();
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => {
        count += 1;
        setElapsed(count);
        if (count >= MAX_SECONDS) rec.stop();
      }, 1000);
    } catch {
      toast.error("Microphone permission denied");
    }
  }

  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border-2 border-border bg-muted/40 p-2">
        <audio controls src={value} className="h-9 min-w-0 flex-1" />
        <span className="shrink-0 text-xs font-bold text-muted-foreground">
          {fmt(seconds ?? 0)}
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0 rounded-full text-destructive"
          onClick={() => onChange(undefined, 0)}
          aria-label="Delete voice memo"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="rounded-full"
      onClick={() => (recording ? stop() : void start())}
    >
      {recording ? (
        <>
          <Square className="mr-1.5 h-4 w-4 fill-destructive text-destructive" />
          {fmt(elapsed)}
        </>
      ) : (
        <>
          <Mic className="mr-1.5 h-4 w-4" /> Voice
        </>
      )}
    </Button>
  );
}

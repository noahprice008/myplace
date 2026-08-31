/** Whole-app backup: every myplace key in localStorage, as one JSON file. */

const PREFIX = "myplace:";

export function exportBackup() {
  const data: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(PREFIX)) continue;
    try {
      data[key] = JSON.parse(localStorage.getItem(key) ?? "null");
    } catch {
      data[key] = localStorage.getItem(key);
    }
  }
  const payload = {
    app: "myplace",
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `myplace-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importBackup(file: File) {
  const text = await file.text();
  const parsed = JSON.parse(text) as { app?: string; data?: Record<string, unknown> };
  if (parsed.app !== "myplace" || !parsed.data) throw new Error("Not a myplace backup file");
  for (const [key, value] of Object.entries(parsed.data)) {
    if (!key.startsWith(PREFIX)) continue;
    localStorage.setItem(key, JSON.stringify(value));
  }
}

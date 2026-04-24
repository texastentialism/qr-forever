/**
 * Local history persistence.
 *
 * Stores generated QR configs in the user's browser (localStorage).
 * Private by design: nothing leaves the device, no server involvement.
 * Optional export/import lets users move history between devices.
 */

import type {
  DotType,
  CornerSquareType,
  CornerDotType,
  ErrorCorrectionLevel,
} from "qr-code-styling";

export type HistoryEntry = {
  id: string;
  url: string;
  createdAt: number; // epoch ms
  style: {
    presetId: string;
    dotColor: string;
    bgColor: string;
    bgTransparent: boolean;
    dotType: DotType;
    cornerSquareType: CornerSquareType;
    cornerDotType: CornerDotType;
    ecLevel: ErrorCorrectionLevel;
    margin: number;
    logoSize: number;
    logoHideDots: boolean;
    // Note: logo image is NOT stored — too large for localStorage, and
    // users can re-attach on reload if they want.
  };
};

const STORAGE_KEY = "qrf.history.v1";
const MAX_ENTRIES = 50;

export function readHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as HistoryEntry[];
  } catch {
    return [];
  }
}

export function writeHistory(entries: HistoryEntry[]) {
  if (typeof window === "undefined") return;
  try {
    const trimmed = entries.slice(0, MAX_ENTRIES);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Quota or disabled — fail quietly.
  }
}

export function addHistory(
  current: HistoryEntry[],
  entry: Omit<HistoryEntry, "id" | "createdAt">
): HistoryEntry[] {
  // Dedupe: if the most recent entry has the same URL + identical style, skip.
  const last = current[0];
  if (
    last &&
    last.url === entry.url &&
    JSON.stringify(last.style) === JSON.stringify(entry.style)
  ) {
    return current;
  }
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  const next: HistoryEntry = {
    id,
    createdAt: Date.now(),
    ...entry,
  };
  return [next, ...current];
}

export function removeHistory(
  current: HistoryEntry[],
  id: string
): HistoryEntry[] {
  return current.filter((e) => e.id !== id);
}

export function clearHistory(): [] {
  return [];
}

export function exportHistoryJson(entries: HistoryEntry[]): string {
  return JSON.stringify(
    {
      app: "qr-forever",
      version: 1,
      exportedAt: new Date().toISOString(),
      entries,
    },
    null,
    2
  );
}

export function importHistoryJson(
  json: string
): HistoryEntry[] | { error: string } {
  try {
    const parsed = JSON.parse(json);
    if (!parsed || !Array.isArray(parsed.entries)) {
      return { error: "File doesn't look like a QR Forever export." };
    }
    // Minimal shape validation
    const valid: HistoryEntry[] = parsed.entries.filter(
      (e: unknown): e is HistoryEntry => {
        if (!e || typeof e !== "object") return false;
        const obj = e as Record<string, unknown>;
        return (
          typeof obj.id === "string" &&
          typeof obj.url === "string" &&
          typeof obj.createdAt === "number" &&
          typeof obj.style === "object" &&
          obj.style !== null
        );
      }
    );
    return valid;
  } catch {
    return { error: "Couldn't parse JSON file." };
  }
}

export function formatRelativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const s = Math.round(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(ms).toLocaleDateString();
}

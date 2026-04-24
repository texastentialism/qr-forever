"use client";

import { useRef } from "react";
import {
  Clock,
  Download as DownloadIcon,
  Upload,
  Trash2,
  X,
} from "lucide-react";
import {
  type HistoryEntry,
  exportHistoryJson,
  formatRelativeTime,
  importHistoryJson,
} from "@/lib/history";

function safeHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function safePath(url: string) {
  try {
    const u = new URL(url);
    return u.pathname + u.search;
  } catch {
    return "";
  }
}

export default function HistoryPanel({
  entries,
  onLoad,
  onRemove,
  onClear,
  onImport,
}: {
  entries: HistoryEntry[];
  onLoad: (entry: HistoryEntry) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onImport: (entries: HistoryEntry[]) => void;
}) {
  const importInputRef = useRef<HTMLInputElement | null>(null);

  function handleExport() {
    const json = exportHistoryJson(entries);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-forever-history-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = importHistoryJson(reader.result as string);
      if ("error" in result) {
        alert(result.error);
      } else {
        onImport(result);
      }
    };
    reader.readAsText(file);
    // Allow re-import of same file
    e.target.value = "";
  }

  return (
    <section className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <h2 className="text-sm font-medium text-neutral-700 flex items-center gap-2">
          <Clock className="size-4" />
          Your recent QRs
          {entries.length > 0 && (
            <span className="text-xs text-neutral-400 font-normal">
              · {entries.length}
            </span>
          )}
        </h2>
        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={handleExport}
            disabled={entries.length === 0}
            className="inline-flex items-center gap-1 px-2.5 py-2 min-h-9 rounded hover:bg-neutral-100 text-neutral-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
            title="Download history as JSON"
          >
            <DownloadIcon className="size-3.5" />
            Export
          </button>
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="inline-flex items-center gap-1 px-2.5 py-2 min-h-9 rounded hover:bg-neutral-100 text-neutral-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
            title="Import JSON export"
          >
            <Upload className="size-3.5" />
            Import
          </button>
          {entries.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm("Clear all saved QRs? This can't be undone.")) {
                  onClear();
                }
              }}
              className="inline-flex items-center gap-1 px-2.5 py-2 min-h-9 rounded hover:bg-red-50 text-neutral-500 hover:text-red-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              title="Clear history"
            >
              <Trash2 className="size-3.5" />
              Clear
            </button>
          )}
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImport}
            aria-label="Import QR history JSON file"
          />
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-neutral-500 py-4 text-center">
          Your recent QRs will show up here — stored only in your browser.
          <br />
          <span className="text-xs">
            Private by design. Nothing leaves your device.
          </span>
        </p>
      ) : (
        <ul className="space-y-1.5 max-h-96 overflow-y-auto -mx-1 px-1">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-50 border border-transparent hover:border-neutral-200 transition-all"
            >
              <button
                onClick={() => onLoad(entry)}
                className="flex-1 text-left min-w-0"
                title="Load this QR config"
              >
                <div className="text-sm font-medium text-neutral-900 truncate">
                  {safeHostname(entry.url)}
                  <span className="text-neutral-400 font-normal">
                    {safePath(entry.url)}
                  </span>
                </div>
                <div className="text-xs text-neutral-500 flex items-center gap-2 mt-0.5">
                  <span>{formatRelativeTime(entry.createdAt)}</span>
                  <span className="size-1 rounded-full bg-neutral-300" />
                  <StyleChip entry={entry} />
                </div>
              </button>
              <button
                type="button"
                onClick={() => onRemove(entry.id)}
                className="opacity-60 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 p-2.5 min-h-11 min-w-11 rounded hover:bg-red-50 text-neutral-400 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 transition-all grid place-items-center"
                title="Remove from history"
                aria-label="Remove"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function StyleChip({ entry }: { entry: HistoryEntry }) {
  const { bgColor, dotColor, bgTransparent } = entry.style;
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className="inline-block size-3 rounded-sm border border-neutral-200"
        style={{
          background: bgTransparent
            ? "repeating-conic-gradient(#d4d4d4 0% 25%, #fff 0% 50%) 0 0 / 4px 4px"
            : bgColor,
        }}
      />
      <span
        className="inline-block size-1.5 rounded-full"
        style={{ background: dotColor }}
      />
    </span>
  );
}

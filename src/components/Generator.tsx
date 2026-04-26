"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type QRCodeStyling from "qr-code-styling";
import type {
  DotType,
  CornerSquareType,
  CornerDotType,
  ErrorCorrectionLevel,
} from "qr-code-styling";
import {
  Check,
  ChevronDown,
  Download,
  Image as ImageIcon,
  Lightbulb,
  Palette,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import HistoryPanel from "./HistoryPanel";
import {
  addHistory,
  clearHistory,
  readHistory,
  removeHistory,
  writeHistory,
  type HistoryEntry,
} from "@/lib/history";
import { getSyncToken, syncEntry } from "@/lib/sync";

type Preset = {
  id: string;
  label: string;
  description: string;
  dotColor: string;
  bgColor: string;
  dotType: DotType;
  cornerSquareType: CornerSquareType;
  cornerDotType: CornerDotType;
  starter?: boolean;
};

// `starter: true` presets are shown in the always-visible row of 4.
// Others sit behind the "More styles" toggle. Order within each group is
// preserved (starters first, then the rest).
const PRESETS: Preset[] = [
  {
    id: "print-classic",
    label: "Print (black on white)",
    description: "Max scan reliability. The safe default.",
    dotColor: "#000000",
    bgColor: "#FFFFFF",
    dotType: "square",
    cornerSquareType: "square",
    cornerDotType: "square",
    starter: true,
  },
  {
    id: "transparent-black",
    label: "Transparent · black",
    description: "For light photos & backgrounds.",
    dotColor: "#000000",
    bgColor: "transparent",
    dotType: "rounded",
    cornerSquareType: "extra-rounded",
    cornerDotType: "dot",
    starter: true,
  },
  {
    id: "transparent-white",
    label: "Transparent · white",
    description: "For dark photos & backgrounds.",
    dotColor: "#FFFFFF",
    bgColor: "transparent",
    dotType: "rounded",
    cornerSquareType: "extra-rounded",
    cornerDotType: "dot",
  },
  {
    id: "inverted",
    label: "White on black",
    description: "Bold, dark-mode feel.",
    dotColor: "#FFFFFF",
    bgColor: "#000000",
    dotType: "rounded",
    cornerSquareType: "extra-rounded",
    cornerDotType: "dot",
    starter: true,
  },
  {
    id: "dots-black",
    label: "Dots · black",
    description: "Friendly, modern circle style.",
    dotColor: "#111111",
    bgColor: "#FFFFFF",
    dotType: "dots",
    cornerSquareType: "dot",
    cornerDotType: "dot",
  },
  {
    id: "warm",
    label: "Espresso · cream",
    description: "Warm editorial palette.",
    dotColor: "#3B2A1A",
    bgColor: "#F7F1E8",
    dotType: "rounded",
    cornerSquareType: "extra-rounded",
    cornerDotType: "dot",
    starter: true,
  },
  {
    id: "sage",
    label: "Forest · linen",
    description: "Muted, natural, calm.",
    dotColor: "#2F4F3A",
    bgColor: "#F3F4EB",
    dotType: "rounded",
    cornerSquareType: "extra-rounded",
    cornerDotType: "dot",
  },
  {
    id: "indigo",
    label: "Indigo · cream",
    description: "Editorial & confident.",
    dotColor: "#1F2A57",
    bgColor: "#F6F1E7",
    dotType: "classy-rounded",
    cornerSquareType: "extra-rounded",
    cornerDotType: "dot",
  },
];

const DOT_TYPES: DotType[] = [
  "square",
  "dots",
  "rounded",
  "classy",
  "classy-rounded",
  "extra-rounded",
];
const CORNER_SQUARE_TYPES: CornerSquareType[] = [
  "square",
  "dot",
  "extra-rounded",
];
const CORNER_DOT_TYPES: CornerDotType[] = ["square", "dot"];

const EXAMPLE_URLS = [
  "https://porchlightstudios.com/book",
  "https://porchlightstudios.com/contact",
  "https://example.com/spring-menu",
  "https://example.com/events",
];

function isLikelyUrl(v: string) {
  if (!v) return false;
  try {
    const u = new URL(v.startsWith("http") ? v : `https://${v}`);
    if (!u.hostname || !u.hostname.includes(".")) return false;
    // Require a real TLD: at least 2 letters after the last dot
    const tld = u.hostname.split(".").pop() ?? "";
    return /^[a-z]{2,}$/i.test(tld);
  } catch {
    return false;
  }
}

/**
 * When the URL is incomplete, return a short, specific hint about what's
 * missing. Returns null for empty input or valid URLs.
 */
function urlHint(v: string): string | null {
  const t = v.trim();
  if (!t) return null;
  if (/\s/.test(t)) return "Spaces aren't allowed in URLs";
  // Strip scheme to inspect hostname-ish portion
  const stripped = t.replace(/^https?:\/\//i, "");
  if (!stripped) return "Add a domain after https://";
  // No dot at all → user is partway through typing the domain
  if (!stripped.includes(".")) return "Add a domain ending (.com, .org, etc.)";
  // Dot present but parse fails → likely malformed
  try {
    const u = new URL(t.startsWith("http") ? t : `https://${t}`);
    if (!u.hostname.includes(".")) return "Domain looks incomplete";
    // Trailing dot or empty TLD
    if (/\.$/.test(u.hostname)) return "Domain looks incomplete";
    if (/\.[^a-z0-9]/i.test(u.hostname)) return "Looks like a typo";
    return "Almost there";
  } catch {
    return "Looks like a typo";
  }
}

function safeHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "qr";
  }
}

function safeFilename(url: string, variant: string, ext: string) {
  const host = safeHostname(url);
  const stamp = new Date().toISOString().slice(0, 10);
  return `${host}-${variant}-${stamp}.${ext}`;
}

export default function Generator() {
  // Core inputs
  const [url, setUrl] = useState("");
  const [presetId, setPresetId] = useState(PRESETS[0].id);
  const [dotColor, setDotColor] = useState(PRESETS[0].dotColor);
  const [bgTransparent, setBgTransparent] = useState(false);
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [dotType, setDotType] = useState<DotType>(PRESETS[0].dotType);
  const [cornerSquareType, setCornerSquareType] = useState<CornerSquareType>(
    PRESETS[0].cornerSquareType
  );
  const [cornerDotType, setCornerDotType] = useState<CornerDotType>(
    PRESETS[0].cornerDotType
  );
  const [ecLevel, setEcLevel] = useState<ErrorCorrectionLevel>("Q");
  const [margin, setMargin] = useState(8);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoHideDots, setLogoHideDots] = useState(true);
  const [logoSize, setLogoSize] = useState(0.3);

  // Preset reveal: starter row is always shown; the rest sit behind a toggle
  const isStarter = (id: string) =>
    PRESETS.find((p) => p.id === id)?.starter === true;
  const [showAllPresets, setShowAllPresets] = useState(
    () => !isStarter(PRESETS[0].id) // safety: open if default isn't a starter
  );
  // If a non-starter preset becomes active (e.g. via history reload), expand
  useEffect(() => {
    if (!isStarter(presetId)) setShowAllPresets(true);
  }, [presetId]);

  // History
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  useEffect(() => {
    setHistory(readHistory());
    setHistoryLoaded(true);
  }, []);
  useEffect(() => {
    if (historyLoaded) writeHistory(history);
  }, [history, historyLoaded]);

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  // Preset application
  const applyingLoadedRef = useRef(false);
  useEffect(() => {
    if (applyingLoadedRef.current) return;
    const p = PRESETS.find((x) => x.id === presetId);
    if (!p) return;
    setDotColor(p.dotColor);
    if (p.bgColor === "transparent") {
      setBgTransparent(true);
    } else {
      setBgTransparent(false);
      setBgColor(p.bgColor);
    }
    setDotType(p.dotType);
    setCornerSquareType(p.cornerSquareType);
    setCornerDotType(p.cornerDotType);
  }, [presetId]);

  const effectiveBg = bgTransparent ? "transparent" : bgColor;
  const urlIsValid = isLikelyUrl(url);
  const urlIssue = urlIsValid ? null : urlHint(url);
  const normalizedUrl = useMemo(() => {
    if (!url) return "";
    if (!/^https?:\/\//i.test(url)) return `https://${url}`;
    return url;
  }, [url]);

  const options = useMemo(
    () => ({
      width: 360,
      height: 360,
      type: "svg" as const,
      data: urlIsValid ? normalizedUrl : "https://example.com",
      margin,
      qrOptions: {
        errorCorrectionLevel: ecLevel,
      },
      image: logoDataUrl || undefined,
      imageOptions: {
        hideBackgroundDots: logoHideDots,
        imageSize: logoSize,
        margin: 4,
        crossOrigin: "anonymous" as const,
      },
      dotsOptions: {
        color: dotColor,
        type: dotType,
      },
      backgroundOptions: {
        color: effectiveBg,
      },
      cornersSquareOptions: {
        color: dotColor,
        type: cornerSquareType,
      },
      cornersDotOptions: {
        color: dotColor,
        type: cornerDotType,
      },
    }),
    [
      urlIsValid,
      normalizedUrl,
      margin,
      ecLevel,
      logoDataUrl,
      logoHideDots,
      logoSize,
      dotColor,
      dotType,
      effectiveBg,
      cornerSquareType,
      cornerDotType,
    ]
  );

  const qrRef = useRef<HTMLDivElement | null>(null);
  const qrInstance = useRef<QRCodeStyling | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mod = await import("qr-code-styling");
      if (cancelled) return;
      const QR = mod.default;
      qrInstance.current = new QR(options);
      if (qrRef.current) {
        qrRef.current.innerHTML = "";
        qrInstance.current.append(qrRef.current);
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!qrInstance.current) return;
    qrInstance.current.update(options);
  }, [options]);

  function saveToHistory() {
    if (!urlIsValid) return;
    setHistory((h) => {
      const next = addHistory(h, {
        url: normalizedUrl,
        style: {
          presetId,
          dotColor,
          bgColor,
          bgTransparent,
          dotType,
          cornerSquareType,
          cornerDotType,
          ecLevel,
          margin,
          logoSize,
          logoHideDots,
        },
      });
      // Fire-and-forget cloud sync if signed in — failures don't block the user
      if (getSyncToken() && next[0] !== h[0]) {
        syncEntry(next[0]).catch(() => {
          /* silent — local is the source of truth */
        });
      }
      return next;
    });
  }

  async function handleDownload(
    ext: "png" | "svg",
    variant: string,
    overrides?: Partial<typeof options>,
    label?: string
  ) {
    if (!qrInstance.current || !urlIsValid) return;
    const snapshot = options;
    qrInstance.current.update({ ...snapshot, ...overrides });
    await new Promise((r) => setTimeout(r, 50));
    qrInstance.current.download({
      name: safeFilename(normalizedUrl, variant, ext).replace(`.${ext}`, ""),
      extension: ext,
    });
    qrInstance.current.update(snapshot);
    saveToHistory();
    showToast(
      label
        ? `Downloaded ${label} · ${safeHostname(normalizedUrl)}`
        : `Downloaded ${safeHostname(normalizedUrl)} .${ext}`
    );
  }

  async function handleHighResPng(variant: string, size: number) {
    if (!qrInstance.current || !urlIsValid) return;
    const snapshot = options;
    qrInstance.current.update({ ...snapshot, width: size, height: size });
    await new Promise((r) => setTimeout(r, 80));
    qrInstance.current.download({
      name: safeFilename(normalizedUrl, `${variant}-${size}px`, "png").replace(
        ".png",
        ""
      ),
      extension: "png",
    });
    qrInstance.current.update(snapshot);
    saveToHistory();
    showToast(
      `Downloaded ${size}×${size} PNG · ${safeHostname(normalizedUrl)}`
    );
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleExample() {
    const pick = EXAMPLE_URLS[Math.floor(Math.random() * EXAMPLE_URLS.length)];
    setUrl(pick);
  }

  function handleLoadEntry(entry: HistoryEntry) {
    applyingLoadedRef.current = true;
    setUrl(entry.url);
    setPresetId(entry.style.presetId);
    setDotColor(entry.style.dotColor);
    setBgColor(entry.style.bgColor);
    setBgTransparent(entry.style.bgTransparent);
    setDotType(entry.style.dotType);
    setCornerSquareType(entry.style.cornerSquareType);
    setCornerDotType(entry.style.cornerDotType);
    setEcLevel(entry.style.ecLevel);
    setMargin(entry.style.margin);
    setLogoSize(entry.style.logoSize);
    setLogoHideDots(entry.style.logoHideDots);
    // Release the preset-sync lock on next tick so presetId changes don't
    // overwrite the restored style.
    setTimeout(() => {
      applyingLoadedRef.current = false;
    }, 50);
    showToast(`Loaded ${safeHostname(entry.url)}`);
    // Scroll to top so user can see the restored preview
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // Cmd/Ctrl+Enter triggers PNG 1024 download
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        if (urlIsValid) {
          e.preventDefault();
          handleHighResPng("hi", 1024);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlIsValid, options]);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-8">
        {/* LEFT: controls (renders SECOND on mobile so downloads stay above the fold) */}
        <div className="space-y-6 order-2 lg:order-1">
          {/* URL input */}
          <section className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-line)] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="url"
                className="block text-sm font-medium text-[var(--color-ink-soft)]"
              >
                Destination URL
              </label>
              <button
                type="button"
                onClick={handleExample}
                className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] inline-flex items-center gap-1 transition-colors"
              >
                <Sparkles className="size-3" />
                Try an example
              </button>
            </div>
            <div className="relative">
              <input
                id="url"
                type="url"
                inputMode="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="porchlightstudios.com/book"
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className={`w-full px-4 py-3 pr-28 rounded-xl border text-base transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                  url === ""
                    ? "border-[var(--color-line-strong)] focus:border-[var(--color-espresso)] focus:ring-[var(--color-espresso)]"
                    : urlIsValid
                    ? "border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500"
                    : "border-amber-300 focus:border-amber-400 focus:ring-amber-400"
                }`}
              />
              {url !== "" && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {urlIsValid ? (
                    <div className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-medium">
                      <Check className="size-3.5" />
                      Valid
                    </div>
                  ) : null}
                </div>
              )}
            </div>
            <p
              className={`mt-2 text-xs ${
                urlIssue ? "text-amber-700" : "text-[var(--color-ink-muted)]"
              }`}
              aria-live="polite"
            >
              {urlIsValid ? (
                <>
                  Will encode:{" "}
                  <span className="font-mono text-[var(--color-ink-soft)]">
                    {normalizedUrl}
                  </span>
                </>
              ) : urlIssue ? (
                urlIssue
              ) : (
                "This exact URL is baked into the QR. Keep the URL live — the QR keeps working."
              )}
            </p>
            <div className="mt-3 flex items-start gap-2 bg-[var(--color-surface-soft)] border border-[var(--color-line)] rounded-lg px-3 py-2.5 text-xs text-[var(--color-ink-soft)]">
              <Lightbulb className="size-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-[var(--color-ink)]">
                  Want to track scans?
                </span>{" "}
                Add UTM parameters:{" "}
                <code className="font-mono text-[11px] bg-[var(--color-surface)] border border-[var(--color-line)] px-1 py-0.5 rounded">
                  ?utm_source=qr&amp;utm_campaign=flyer
                </code>
                . They show up in Google Analytics, Plausible, etc.
              </div>
            </div>
          </section>

          {/* Presets */}
          <section className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-line)] p-5 shadow-sm">
            <h2 className="text-sm font-medium text-[var(--color-ink-soft)] mb-3 flex items-center gap-2">
              <Palette className="size-4" />
              Style
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {PRESETS.filter((p) => p.starter).map((p) => (
                <PresetButton
                  key={p.id}
                  preset={p}
                  active={presetId === p.id}
                  onClick={() => setPresetId(p.id)}
                />
              ))}
            </div>
            {showAllPresets ? (
              <>
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                  {PRESETS.filter((p) => !p.starter).map((p) => (
                    <PresetButton
                      key={p.id}
                      preset={p}
                      active={presetId === p.id}
                      onClick={() => setPresetId(p.id)}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllPresets(false)}
                  className="mt-3 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
                >
                  Show fewer styles
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowAllPresets(true)}
                className="mt-3 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] inline-flex items-center gap-1 transition-colors"
              >
                <ChevronDown className="size-3" />
                More styles
                <span className="text-[var(--color-ink-faint)]">
                  · {PRESETS.filter((p) => !p.starter).length}
                </span>
              </button>
            )}
          </section>

          {/* Advanced controls */}
          <details className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-line)] shadow-sm group">
            <summary className="cursor-pointer select-none list-none p-5 flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--color-ink-soft)]">
                Fine-tune
              </span>
              <div className="flex items-center gap-2 text-xs text-[var(--color-ink-faint)]">
                <span className="group-open:hidden">
                  Colors, shapes, error correction
                </span>
                <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
              </div>
            </summary>
            <div className="px-5 pb-5">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Field label="Dot color">
                  <ColorPair value={dotColor} onChange={setDotColor} />
                </Field>
                <Field label="Background">
                  <ColorPair
                    value={bgColor}
                    onChange={setBgColor}
                    disabled={bgTransparent}
                    displayValue={bgTransparent ? "transparent" : undefined}
                  />
                  <label className="flex items-center gap-2 mt-2 text-xs text-[var(--color-ink-soft)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bgTransparent}
                      onChange={(e) => setBgTransparent(e.target.checked)}
                      className="rounded"
                    />
                    Transparent
                  </label>
                </Field>
                <Field label="Dot style">
                  <Select
                    value={dotType}
                    onChange={(v) => setDotType(v as DotType)}
                    options={DOT_TYPES}
                  />
                </Field>
                <Field label="Corner frame">
                  <Select
                    value={cornerSquareType}
                    onChange={(v) =>
                      setCornerSquareType(v as CornerSquareType)
                    }
                    options={CORNER_SQUARE_TYPES}
                  />
                </Field>
                <Field label="Corner dot">
                  <Select
                    value={cornerDotType}
                    onChange={(v) => setCornerDotType(v as CornerDotType)}
                    options={CORNER_DOT_TYPES}
                  />
                </Field>
                <Field
                  label={`Error correction: ${ecLevel}`}
                  hint="Higher = more scannable if damaged. Q is a safe print default."
                >
                  <Select
                    value={ecLevel}
                    onChange={(v) => setEcLevel(v as ErrorCorrectionLevel)}
                    options={["L", "M", "Q", "H"]}
                    labels={{
                      L: "L — Low (~7%)",
                      M: "M — Medium (~15%)",
                      Q: "Q — Quartile (~25%)",
                      H: "H — High (~30%)",
                    }}
                  />
                </Field>
                <Field label={`Margin · ${margin}px`}>
                  <input
                    type="range"
                    min={0}
                    max={40}
                    value={margin}
                    onChange={(e) => setMargin(Number(e.target.value))}
                    className="w-full accent-[var(--color-espresso)]"
                  />
                </Field>
              </div>
            </div>
          </details>

          {/* Logo */}
          <details className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-line)] shadow-sm group">
            <summary className="cursor-pointer select-none list-none p-5 flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--color-ink-soft)] inline-flex items-center gap-2">
                <ImageIcon className="size-4" />
                Center logo
                {logoDataUrl && (
                  <span className="ml-1 text-xs text-emerald-600 font-normal">
                    · added
                  </span>
                )}
              </span>
              <div className="flex items-center gap-2 text-xs text-[var(--color-ink-faint)]">
                <span className="group-open:hidden">Optional</span>
                <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
              </div>
            </summary>
            <div className="px-5 pb-5">
              <div className="flex items-start gap-4 flex-wrap">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--color-line-strong)] hover:bg-[var(--color-surface-soft)] cursor-pointer text-sm transition-colors">
                  <Upload className="size-4" />
                  {logoDataUrl ? "Replace logo" : "Upload image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </label>
                {logoDataUrl && (
                  <>
                    <button
                      onClick={() => setLogoDataUrl(null)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--color-line-strong)] hover:bg-[var(--color-surface-soft)] text-sm text-[var(--color-ink-soft)] transition-colors"
                    >
                      <X className="size-4" /> Remove
                    </button>
                    <div className="flex-1 min-w-[200px] space-y-2">
                      <Field label={`Size · ${Math.round(logoSize * 100)}%`}>
                        <input
                          type="range"
                          min={0.1}
                          max={0.5}
                          step={0.01}
                          value={logoSize}
                          onChange={(e) =>
                            setLogoSize(Number(e.target.value))
                          }
                          className="w-full accent-[var(--color-espresso)]"
                        />
                      </Field>
                      <label className="flex items-center gap-2 text-xs text-[var(--color-ink-soft)] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={logoHideDots}
                          onChange={(e) => setLogoHideDots(e.target.checked)}
                          className="rounded"
                        />
                        Clear dots behind logo
                      </label>
                    </div>
                  </>
                )}
              </div>
              {logoDataUrl && ecLevel !== "H" && (
                <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                  Tip: with a logo, raise error correction to{" "}
                  <button
                    className="underline font-medium"
                    onClick={() => setEcLevel("H")}
                  >
                    H (30%)
                  </button>{" "}
                  for best scan reliability.
                </p>
              )}
            </div>
          </details>
        </div>

        {/* RIGHT: preview + downloads (renders FIRST on mobile so the primary action is reachable without scrolling) */}
        <aside className="lg:sticky lg:top-6 lg:self-start space-y-4 order-1 lg:order-2">
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-line)] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-[var(--color-ink-soft)]">
                Live preview
              </div>
              <div
                className={`text-xs transition-opacity ${
                  urlIsValid ? "text-emerald-600" : "text-[var(--color-ink-faint)]"
                }`}
              >
                {urlIsValid ? "Ready to download" : "Enter a URL"}
              </div>
            </div>
            <div
              className="rounded-xl overflow-hidden grid place-items-center p-6 transition-all"
              style={{
                backgroundImage: bgTransparent
                  ? "repeating-conic-gradient(#e5e5e5 0% 25%, transparent 0% 50%)"
                  : undefined,
                backgroundSize: bgTransparent ? "14px 14px" : undefined,
                backgroundColor: "#fafafa",
              }}
            >
              <div
                ref={qrRef}
                className={`size-[360px] transition-opacity duration-200 ${
                  urlIsValid ? "opacity-100" : "opacity-30"
                }`}
              />
            </div>
            <div className="mt-3 text-xs text-[var(--color-ink-muted)] text-center break-all px-2">
              {urlIsValid
                ? normalizedUrl
                : "Preview unlocks once the URL is valid"}
            </div>
          </div>

          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-line)] p-5 shadow-sm space-y-3">
            <div className="text-sm font-medium text-[var(--color-ink-soft)] flex items-center gap-2">
              <Download className="size-4" />
              Download
            </div>
            <div className="grid grid-cols-2 gap-2">
              <DownloadBtn
                label="PNG · 1024"
                sub="Web / email · ⌘↵"
                onClick={() => handleHighResPng("hi", 1024)}
                disabled={!ready || !urlIsValid}
                primary
              />
              <DownloadBtn
                label="PNG · 2048"
                sub="Print / signage"
                onClick={() => handleHighResPng("print", 2048)}
                disabled={!ready || !urlIsValid}
                primary
              />
              <DownloadBtn
                label="SVG"
                sub="Infinite scale"
                onClick={() =>
                  handleDownload("svg", "vector", undefined, "SVG vector")
                }
                disabled={!ready || !urlIsValid}
              />
              <DownloadBtn
                label="PNG · 360"
                sub="As previewed"
                onClick={() =>
                  handleDownload("png", "web", undefined, "360px PNG")
                }
                disabled={!ready || !urlIsValid}
              />
            </div>
            <div className="pt-3 border-t border-[var(--color-line)]">
              <div className="text-xs font-medium text-[var(--color-ink-muted)] uppercase tracking-wide mb-1">
                For layering onto backgrounds
              </div>
              <div className="text-[11px] text-[var(--color-ink-faint)] mb-2">
                Transparent so you can place them over your own design
              </div>
              <div className="grid grid-cols-1 gap-2">
                <DownloadBtn
                  label="Transparent · black dots"
                  sub="Over light photos"
                  onClick={() =>
                    handleDownload(
                      "png",
                      "transparent-black",
                      {
                        backgroundOptions: { color: "transparent" },
                        dotsOptions: { color: "#000000", type: dotType },
                        cornersSquareOptions: {
                          color: "#000000",
                          type: cornerSquareType,
                        },
                        cornersDotOptions: {
                          color: "#000000",
                          type: cornerDotType,
                        },
                      },
                      "Transparent black PNG"
                    )
                  }
                  disabled={!ready || !urlIsValid}
                />
                <DownloadBtn
                  label="Transparent · white dots"
                  sub="Over dark photos"
                  onClick={() =>
                    handleDownload(
                      "png",
                      "transparent-white",
                      {
                        backgroundOptions: { color: "transparent" },
                        dotsOptions: { color: "#FFFFFF", type: dotType },
                        cornersSquareOptions: {
                          color: "#FFFFFF",
                          type: cornerSquareType,
                        },
                        cornersDotOptions: {
                          color: "#FFFFFF",
                          type: cornerDotType,
                        },
                      },
                      "Transparent white PNG"
                    )
                  }
                  disabled={!ready || !urlIsValid}
                />
              </div>
            </div>
          </div>

          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-sm text-amber-900">
            <div className="font-medium mb-1.5">Before you print</div>
            <ol className="list-decimal list-inside space-y-1 text-amber-800/90 text-[13px] leading-relaxed">
              <li>Test-scan with 2+ phones (iOS + Android).</li>
              <li>Keep at least a 4mm white quiet zone around the QR.</li>
              <li>
                Don{"'"}t print smaller than 2cm × 2cm. Bigger is always safer.
              </li>
            </ol>
          </div>
        </aside>
      </div>

      {/* History section */}
      <div className="mt-12">
        <HistoryPanel
          entries={history}
          onLoad={handleLoadEntry}
          onRemove={(id) => setHistory((h) => removeHistory(h, id))}
          onClear={() => setHistory(clearHistory())}
          onImport={(entries) => {
            setHistory(entries);
            // If signed in to family sync, backfill imported entries to cloud.
            // POST is idempotent (deduped by id server-side), so re-imports
            // won't create duplicates in the shared gist.
            if (getSyncToken() && entries.length > 0) {
              (async () => {
                let ok = 0;
                let fail = 0;
                for (const e of entries) {
                  const r = await syncEntry(e);
                  if (r.ok) ok++;
                  else fail++;
                }
                showToast(
                  fail === 0
                    ? `Synced ${ok} entries to family space`
                    : `Synced ${ok}, ${fail} failed`
                );
              })();
            }
          }}
        />
      </div>

      {/* Toast */}
      <div
        aria-live="polite"
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 transition-all duration-300 pointer-events-none z-50 ${
          toast
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-3"
        }`}
      >
        <div className="bg-[var(--color-espresso)] text-[var(--color-paper)] text-sm px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 max-w-[90vw]">
          <Check className="size-4 text-emerald-400 shrink-0" />
          <span className="truncate">{toast}</span>
        </div>
      </div>
    </>
  );
}

function PresetButton({
  preset,
  active,
  onClick,
}: {
  preset: Preset;
  active: boolean;
  onClick: () => void;
}) {
  const isTransparent = preset.bgColor === "transparent";
  return (
    <button
      onClick={onClick}
      className={`group text-left p-3 rounded-xl border transition-all ${
        active
          ? "border-[var(--color-espresso)] bg-[var(--color-espresso)] text-[var(--color-paper)] shadow-sm"
          : "border-[var(--color-line)] hover:border-[var(--color-line-strong)] bg-[var(--color-surface)]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{preset.label}</div>
          <div
            className={`text-xs mt-0.5 leading-snug line-clamp-2 ${
              active ? "text-[var(--color-ink-faint)]" : "text-[var(--color-ink-muted)]"
            }`}
          >
            {preset.description}
          </div>
        </div>
        {/* Split-pill color swatch: left half bg, right half dot color */}
        <div
          className="flex shrink-0 mt-0.5 rounded overflow-hidden border"
          style={{
            width: "30px",
            height: "20px",
            borderColor: active ? "var(--color-espresso-hover)" : "var(--color-line)",
          }}
        >
          <div
            className="flex-1"
            style={{
              background: isTransparent
                ? "repeating-conic-gradient(#d4d4d4 0% 25%, #fff 0% 50%) 0 0 / 6px 6px"
                : preset.bgColor,
            }}
          />
          <div className="flex-1" style={{ background: preset.dotColor }} />
        </div>
      </div>
    </button>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  // Native <label> nesting associates to the first form control inside
  return (
    <label className="block">
      <span className="text-xs font-medium text-[var(--color-ink-soft)] mb-1.5 block">
        {label}
      </span>
      {children}
      {hint && <div className="text-xs text-[var(--color-ink-faint)] mt-1">{hint}</div>}
    </label>
  );
}

function ColorPair({
  value,
  onChange,
  disabled,
  displayValue,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  displayValue?: string;
  ariaLabel?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label={ariaLabel ? `${ariaLabel} — color picker` : "Color picker"}
        className="h-11 w-11 rounded border border-[var(--color-line-strong)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--color-espresso)] focus:ring-offset-1"
      />
      <input
        type="text"
        value={displayValue ?? value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label={ariaLabel ? `${ariaLabel} — hex value` : "Color hex value"}
        className="flex-1 min-w-0 px-2 py-1.5 text-sm rounded border border-[var(--color-line-strong)] font-mono disabled:bg-[var(--color-surface-soft)] disabled:text-[var(--color-ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-espresso)] focus:ring-offset-1"
      />
    </div>
  );
}

function Select<T extends string>({
  value,
  onChange,
  options,
  labels,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly T[];
  labels?: Partial<Record<T, string>>;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="w-full px-2 py-2 text-sm rounded border border-[var(--color-line-strong)] bg-[var(--color-surface)] cursor-pointer"
    >
      {options.map((t) => (
        <option key={t} value={t}>
          {labels?.[t] ?? t}
        </option>
      ))}
    </select>
  );
}

function DownloadBtn({
  label,
  sub,
  onClick,
  disabled,
  primary,
}: {
  label: string;
  sub?: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  const base =
    "px-3 py-2.5 text-sm rounded-xl border transition-all disabled:opacity-40 disabled:cursor-not-allowed text-left active:scale-[0.98]";
  const cls = primary
    ? `${base} bg-[var(--color-espresso)] text-[var(--color-paper)] border-[var(--color-espresso)] hover:bg-[var(--color-espresso-hover)]`
    : `${base} bg-[var(--color-surface)] text-[var(--color-ink)] border-[var(--color-line-strong)] hover:border-[var(--color-ink-muted)] hover:bg-[var(--color-surface-soft)]`;
  return (
    <button onClick={onClick} disabled={disabled} className={cls}>
      <div className="font-medium leading-tight">{label}</div>
      {sub && (
        <div
          className={`text-[11px] mt-0.5 leading-tight ${
            primary ? "text-[var(--color-ink-faint)]" : "text-[var(--color-ink-muted)]"
          }`}
        >
          {sub}
        </div>
      )}
    </button>
  );
}

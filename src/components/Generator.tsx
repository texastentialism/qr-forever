"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type QRCodeStyling from "qr-code-styling";
import type {
  DotType,
  CornerSquareType,
  CornerDotType,
  ErrorCorrectionLevel,
} from "qr-code-styling";
import { Download, Image as ImageIcon, Palette, Upload, X } from "lucide-react";

type Preset = {
  id: string;
  label: string;
  description: string;
  dotColor: string;
  bgColor: string; // "transparent" or hex
  dotType: DotType;
  cornerSquareType: CornerSquareType;
  cornerDotType: CornerDotType;
};

const PRESETS: Preset[] = [
  {
    id: "print-classic",
    label: "Print (black on white)",
    description: "Standard print. Max scan reliability.",
    dotColor: "#000000",
    bgColor: "#FFFFFF",
    dotType: "square",
    cornerSquareType: "square",
    cornerDotType: "square",
  },
  {
    id: "transparent-black",
    label: "Transparent · black",
    description: "For light photos / light backgrounds.",
    dotColor: "#000000",
    bgColor: "transparent",
    dotType: "rounded",
    cornerSquareType: "extra-rounded",
    cornerDotType: "dot",
  },
  {
    id: "transparent-white",
    label: "Transparent · white",
    description: "For dark photos / dark backgrounds.",
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
  },
  {
    id: "dots-black",
    label: "Dots · black",
    description: "Friendly, modern dot style.",
    dotColor: "#111111",
    bgColor: "#FFFFFF",
    dotType: "dots",
    cornerSquareType: "dot",
    cornerDotType: "dot",
  },
  {
    id: "warm",
    label: "Warm · espresso",
    description: "Deep brown on cream — for Porchlight.",
    dotColor: "#3B2A1A",
    bgColor: "#F7F1E8",
    dotType: "rounded",
    cornerSquareType: "extra-rounded",
    cornerDotType: "dot",
  },
  {
    id: "sage",
    label: "Sage · forest",
    description: "Muted natural palette.",
    dotColor: "#2F4F3A",
    bgColor: "#F3F4EB",
    dotType: "rounded",
    cornerSquareType: "extra-rounded",
    cornerDotType: "dot",
  },
  {
    id: "indigo",
    label: "Indigo · cream",
    description: "Editorial, confident.",
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
const EC_LEVELS: ErrorCorrectionLevel[] = ["L", "M", "Q", "H"];

function safeFilename(url: string, variant: string, ext: string) {
  const host = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "qr";
    }
  })();
  const stamp = new Date().toISOString().slice(0, 10);
  return `${host}-${variant}-${stamp}.${ext}`;
}

export default function Generator() {
  const [url, setUrl] = useState("https://");
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

  const qrRef = useRef<HTMLDivElement | null>(null);
  const qrInstance = useRef<QRCodeStyling | null>(null);
  const [ready, setReady] = useState(false);

  // Apply preset on change
  useEffect(() => {
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

  const options = useMemo(
    () => ({
      width: 360,
      height: 360,
      type: "svg" as const,
      data: url && url !== "https://" ? url : "https://example.com",
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
      url,
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

  // Initialize QR once on mount
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

  // Update on any option change
  useEffect(() => {
    if (!qrInstance.current) return;
    qrInstance.current.update(options);
  }, [options]);

  const hasUrl = url.trim() !== "" && url.trim() !== "https://";

  async function handleDownload(
    ext: "png" | "svg",
    variant: string,
    overrides?: Partial<typeof options>
  ) {
    if (!qrInstance.current) return;
    // Apply overrides temporarily, download, then restore
    const snapshot = options;
    qrInstance.current.update({ ...snapshot, ...overrides });
    await new Promise((r) => setTimeout(r, 50));
    qrInstance.current.download({
      name: safeFilename(url, variant, ext).replace(`.${ext}`, ""),
      extension: ext,
    });
    // Restore live preview
    qrInstance.current.update(snapshot);
  }

  async function handleHighResPng(variant: string, size: number) {
    if (!qrInstance.current) return;
    const snapshot = options;
    qrInstance.current.update({ ...snapshot, width: size, height: size });
    await new Promise((r) => setTimeout(r, 80));
    qrInstance.current.download({
      name: safeFilename(url, `${variant}-${size}px`, "png").replace(
        ".png",
        ""
      ),
      extension: "png",
    });
    qrInstance.current.update(snapshot);
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8">
      {/* LEFT: controls + preview */}
      <div className="space-y-8">
        {/* URL input */}
        <section className="bg-white rounded-2xl border border-neutral-200 p-5">
          <label
            htmlFor="url"
            className="block text-sm font-medium text-neutral-700 mb-2"
          >
            Destination URL
          </label>
          <input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://porchlightstudios.com/book"
            className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none text-base"
          />
          <p className="mt-2 text-xs text-neutral-500">
            This exact URL is encoded into the QR. Keep this URL live and your
            QR keeps working — for years, decades, forever.
          </p>
        </section>

        {/* Presets */}
        <section className="bg-white rounded-2xl border border-neutral-200 p-5">
          <h2 className="text-sm font-medium text-neutral-700 mb-3 flex items-center gap-2">
            <Palette className="size-4" />
            Presets
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPresetId(p.id)}
                className={`text-left p-3 rounded-xl border transition-all ${
                  presetId === p.id
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 hover:border-neutral-400 bg-white"
                }`}
              >
                <div className="text-sm font-medium">{p.label}</div>
                <div
                  className={`text-xs mt-0.5 ${
                    presetId === p.id ? "text-neutral-300" : "text-neutral-500"
                  }`}
                >
                  {p.description}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Advanced controls */}
        <section className="bg-white rounded-2xl border border-neutral-200 p-5">
          <h2 className="text-sm font-medium text-neutral-700 mb-4">
            Fine-tune
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Dot color">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={dotColor}
                  onChange={(e) => setDotColor(e.target.value)}
                  className="size-9 rounded border border-neutral-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={dotColor}
                  onChange={(e) => setDotColor(e.target.value)}
                  className="flex-1 px-2 py-1.5 text-sm rounded border border-neutral-300 font-mono"
                />
              </div>
            </Field>
            <Field label="Background">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  disabled={bgTransparent}
                  className="size-9 rounded border border-neutral-300 cursor-pointer disabled:opacity-40"
                />
                <input
                  type="text"
                  value={bgTransparent ? "transparent" : bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  disabled={bgTransparent}
                  className="flex-1 px-2 py-1.5 text-sm rounded border border-neutral-300 font-mono disabled:bg-neutral-100"
                />
              </div>
              <label className="flex items-center gap-2 mt-2 text-xs text-neutral-600">
                <input
                  type="checkbox"
                  checked={bgTransparent}
                  onChange={(e) => setBgTransparent(e.target.checked)}
                />
                Transparent
              </label>
            </Field>
            <Field label="Dot style">
              <select
                value={dotType}
                onChange={(e) => setDotType(e.target.value as DotType)}
                className="w-full px-2 py-2 text-sm rounded border border-neutral-300 bg-white"
              >
                {DOT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Corner frame">
              <select
                value={cornerSquareType}
                onChange={(e) =>
                  setCornerSquareType(e.target.value as CornerSquareType)
                }
                className="w-full px-2 py-2 text-sm rounded border border-neutral-300 bg-white"
              >
                {CORNER_SQUARE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Corner dot">
              <select
                value={cornerDotType}
                onChange={(e) =>
                  setCornerDotType(e.target.value as CornerDotType)
                }
                className="w-full px-2 py-2 text-sm rounded border border-neutral-300 bg-white"
              >
                {CORNER_DOT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label={`Error correction: ${ecLevel}`}
              hint="Higher = more scannable if printed or damaged. Q is recommended for print."
            >
              <select
                value={ecLevel}
                onChange={(e) =>
                  setEcLevel(e.target.value as ErrorCorrectionLevel)
                }
                className="w-full px-2 py-2 text-sm rounded border border-neutral-300 bg-white"
              >
                <option value="L">L — Low (~7%)</option>
                <option value="M">M — Medium (~15%)</option>
                <option value="Q">Q — Quartile (~25%, recommended)</option>
                <option value="H">H — High (~30%)</option>
              </select>
            </Field>
            <Field label={`Margin: ${margin}px`}>
              <input
                type="range"
                min={0}
                max={40}
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
                className="w-full"
              />
            </Field>
          </div>
        </section>

        {/* Logo */}
        <section className="bg-white rounded-2xl border border-neutral-200 p-5">
          <h2 className="text-sm font-medium text-neutral-700 mb-3 flex items-center gap-2">
            <ImageIcon className="size-4" />
            Center logo (optional)
          </h2>
          <div className="flex items-start gap-4">
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-300 hover:bg-neutral-50 cursor-pointer text-sm">
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
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-300 hover:bg-neutral-50 text-sm text-neutral-700"
                >
                  <X className="size-4" /> Remove
                </button>
                <div className="flex-1 space-y-2">
                  <Field label={`Size: ${Math.round(logoSize * 100)}%`}>
                    <input
                      type="range"
                      min={0.1}
                      max={0.5}
                      step={0.01}
                      value={logoSize}
                      onChange={(e) => setLogoSize(Number(e.target.value))}
                      className="w-full"
                    />
                  </Field>
                  <label className="flex items-center gap-2 text-xs text-neutral-600">
                    <input
                      type="checkbox"
                      checked={logoHideDots}
                      onChange={(e) => setLogoHideDots(e.target.checked)}
                    />
                    Clear dots behind logo
                  </label>
                </div>
              </>
            )}
          </div>
          <p className="mt-3 text-xs text-neutral-500">
            Tip: with a logo, use error correction H for maximum scan
            reliability.
          </p>
        </section>
      </div>

      {/* RIGHT: preview + downloads */}
      <aside className="lg:sticky lg:top-6 lg:self-start space-y-4">
        <div className="bg-white rounded-2xl border border-neutral-200 p-5">
          <div className="text-sm font-medium text-neutral-700 mb-3">
            Live preview
          </div>
          <div
            className="rounded-xl overflow-hidden grid place-items-center p-6"
            style={{
              backgroundImage: bgTransparent
                ? "repeating-conic-gradient(#e5e5e5 0% 25%, transparent 0% 50%)"
                : undefined,
              backgroundSize: bgTransparent ? "16px 16px" : undefined,
              backgroundColor: bgTransparent ? "#fafafa" : "transparent",
            }}
          >
            <div ref={qrRef} className="size-[360px]" />
          </div>
          <div className="mt-3 text-xs text-neutral-500 text-center break-all">
            {hasUrl ? url : "Enter a URL above to preview"}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-3">
          <div className="text-sm font-medium text-neutral-700 flex items-center gap-2">
            <Download className="size-4" />
            Download
          </div>
          <div className="grid grid-cols-2 gap-2">
            <DownloadBtn
              label="PNG · 1024"
              onClick={() => handleHighResPng("hi", 1024)}
              disabled={!ready || !hasUrl}
              primary
            />
            <DownloadBtn
              label="PNG · 2048"
              onClick={() => handleHighResPng("print", 2048)}
              disabled={!ready || !hasUrl}
              primary
            />
            <DownloadBtn
              label="SVG (vector)"
              onClick={() => handleDownload("svg", "vector")}
              disabled={!ready || !hasUrl}
            />
            <DownloadBtn
              label="PNG · 360"
              onClick={() => handleDownload("png", "web")}
              disabled={!ready || !hasUrl}
            />
          </div>
          <div className="pt-3 border-t border-neutral-100">
            <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
              Quick variants
            </div>
            <div className="grid grid-cols-1 gap-2">
              <DownloadBtn
                label="Transparent · black dots"
                onClick={() =>
                  handleDownload("png", "transparent-black", {
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
                  })
                }
                disabled={!ready || !hasUrl}
              />
              <DownloadBtn
                label="Transparent · white dots"
                onClick={() =>
                  handleDownload("png", "transparent-white", {
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
                  })
                }
                disabled={!ready || !hasUrl}
              />
            </div>
          </div>
          <p className="text-xs text-neutral-500 pt-2">
            For print, SVG scales infinitely without blurring. PNG 2048 is safe
            for large signage.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-900">
          <div className="font-medium mb-1">Before you print</div>
          <ol className="list-decimal list-inside space-y-1 text-amber-800">
            <li>Test-scan with at least 2 phones (iOS + Android).</li>
            <li>Keep at least a 4mm quiet zone (white margin) around the QR.</li>
            <li>Don&apos;t resize below 2cm × 2cm on physical prints.</li>
          </ol>
        </div>
      </aside>
    </div>
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
  return (
    <div>
      <div className="text-xs font-medium text-neutral-600 mb-1.5">{label}</div>
      {children}
      {hint && <div className="text-xs text-neutral-400 mt-1">{hint}</div>}
    </div>
  );
}

function DownloadBtn({
  label,
  onClick,
  disabled,
  primary,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  const base =
    "px-3 py-2 text-sm rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  const cls = primary
    ? `${base} bg-neutral-900 text-white border-neutral-900 hover:bg-neutral-800`
    : `${base} bg-white text-neutral-800 border-neutral-300 hover:border-neutral-500`;
  return (
    <button onClick={onClick} disabled={disabled} className={cls}>
      {label}
    </button>
  );
}

import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "QR Forever — QR codes that never expire. Direct-encoded, print-safe, free.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background:
            "linear-gradient(135deg, #fafaf7 0%, #f3efe6 50%, #eae4d4 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#0a0a0a",
          position: "relative",
        }}
      >
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "#0a0a0a",
              color: "#fafafa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              fontWeight: 700,
            }}
          >
            Q
          </div>
          <div
            style={{ fontSize: "28px", fontWeight: 600, letterSpacing: "-0.01em" }}
          >
            QR Forever
          </div>
        </div>

        {/* Main headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: "92px",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.0,
              maxWidth: "900px",
            }}
          >
            <span>QR codes that</span>
            <span>never expire.</span>
          </div>
          <div
            style={{
              fontSize: "30px",
              lineHeight: 1.35,
              color: "#525252",
              maxWidth: "880px",
            }}
          >
            Free, private, print-safe. The QR encodes your URL directly —
            no redirect, no shortener, no middleman.
          </div>
        </div>

        {/* Footer row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: "22px",
            color: "#737373",
          }}
        >
          <div style={{ display: "flex", gap: "32px" }}>
            <span>Transparent PNG</span>
            <span style={{ color: "#d4d4d4" }}>·</span>
            <span>SVG vector</span>
            <span style={{ color: "#d4d4d4" }}>·</span>
            <span>No accounts</span>
          </div>
          <div
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              color: "#404040",
            }}
          >
            qr-forever-delta.vercel.app
          </div>
        </div>

        {/* Decorative QR finder patterns in top-right */}
        <div
          style={{
            position: "absolute",
            top: "80px",
            right: "80px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", gap: "8px" }}>
            <FinderPattern />
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", justifyContent: "center" }}>
              <Dot /><Dot /><Dot />
            </div>
            <FinderPattern />
          </div>
          <div style={{ display: "flex", gap: "4px", paddingLeft: "4px" }}>
            <Dot /><Dot /><Dot /><Dot /><Dot />
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <FinderPattern />
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}

function FinderPattern() {
  return (
    <div
      style={{
        width: "54px",
        height: "54px",
        borderRadius: "10px",
        background: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "30px",
          height: "30px",
          borderRadius: "5px",
          background: "#fafaf7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "14px",
            height: "14px",
            borderRadius: "3px",
            background: "#0a0a0a",
          }}
        />
      </div>
    </div>
  );
}

function Dot() {
  return (
    <div
      style={{
        width: "12px",
        height: "12px",
        borderRadius: "12px",
        background: "#0a0a0a",
      }}
    />
  );
}

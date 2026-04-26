import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

// Display serif for the wordmark and section titles. Fraunces has a soft
// optical-size axis that reads warm at large sizes — fits the
// "Espresso · cream" editorial direction without leaning twee.
const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
  display: "swap",
});

// Body sans. IBM Plex Sans pairs cleanly with Fraunces and avoids the
// Inter / Geist defaults the critique flagged as generic.
const plexSans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://qr-forever-delta.vercel.app");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  title: {
    default: "QR Forever — Free QR Code Generator That Never Expires",
    template: "%s · QR Forever",
  },
  description:
    "Free, private, print-safe QR code generator. The QR encodes your URL directly — no redirect, no shortener, no expiration. Built for print media.",
  applicationName: "QR Forever",
  keywords: [
    "QR code generator",
    "free QR code",
    "QR code for print",
    "transparent PNG QR",
    "SVG QR code",
    "QR code that never expires",
    "permanent QR code",
  ],
  authors: [{ name: "texastentialism", url: "https://github.com/texastentialism" }],
  creator: "texastentialism",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "QR Forever",
    title: "QR Forever — QR codes that never expire",
    description:
      "Free, private, print-safe QR code generator. The QR encodes your URL directly — no redirect, no shortener, no middleman. Safe to print on anything.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "QR Forever — QR codes that never expire",
    description:
      "Free, private, print-safe QR code generator. No accounts. No tracking. Direct URL encoding.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f1e3" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${plexSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}

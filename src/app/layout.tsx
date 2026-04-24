import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QR Forever — QR codes that never expire",
  description:
    "Generate beautiful QR codes for print. No accounts, no expiration, no tracking. The QR encodes your URL directly, so it works forever.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-neutral-50 text-neutral-900 flex flex-col">
        {children}
      </body>
    </html>
  );
}

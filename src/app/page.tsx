import Link from "next/link";
import Generator from "@/components/Generator";
import Faq from "@/components/Faq";
import { Logo } from "@/components/Logo";

export default function Home() {
  return (
    <main className="flex-1 w-full">
      <div className="mx-auto max-w-6xl px-6 py-10 md:py-16">
        <header className="mb-10 md:mb-14">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <Logo size={44} />
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                  QR Forever
                </h1>
                <p className="text-sm text-neutral-500">
                  QR codes that never expire · No accounts · Free
                </p>
              </div>
            </div>
            <Link
              href="/sign-in"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-300 hover:border-neutral-500 hover:bg-white text-sm text-neutral-700 transition-colors"
              title="Optional: sign in to sync history with your family"
            >
              Family sync
            </Link>
          </div>
          <p className="max-w-2xl text-neutral-600 leading-relaxed">
            Every QR code you generate here encodes your URL{" "}
            <span className="font-semibold text-neutral-900">directly</span>.
            There is no redirect, no shortener, no database. As long as the
            destination URL works, your QR works — forever. Safe to print on
            anything.
          </p>
        </header>
        <Generator />
        <Faq />
        <footer className="mt-16 pt-8 border-t border-neutral-200 text-sm text-neutral-500 flex flex-col md:flex-row justify-between gap-3">
          <div>
            Built for print. Scan-tested at standard density (error correction
            Q).
          </div>
          <div className="flex gap-4">
            <a
              href="https://github.com/texastentialism/qr-forever"
              className="hover:text-neutral-900 transition-colors"
            >
              Source on GitHub
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}

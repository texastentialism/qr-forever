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
                <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-[var(--color-ink)] leading-[1.05]">
                  QR Forever
                </h1>
                <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">
                  QR codes that never expire · No accounts · Free
                </p>
              </div>
            </div>
            <Link
              href="/sign-in"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface)] text-sm text-[var(--color-ink-soft)] transition-colors"
              title="Optional: sign in to sync history with your family"
            >
              Family sync
            </Link>
          </div>
          <p className="max-w-2xl text-[var(--color-ink-soft)] leading-relaxed text-[15px]">
            Every QR code you generate here encodes your URL{" "}
            <span className="font-semibold text-[var(--color-espresso)]">
              directly
            </span>
            . There is no redirect, no shortener, no database. As long as the
            destination URL works, your QR works — forever. Safe to print on
            anything.
          </p>
        </header>
        <Generator />
        <Faq />
        <footer className="mt-16 pt-8 border-t border-[var(--color-border)] text-sm text-[var(--color-ink-muted)] flex flex-col md:flex-row justify-between gap-3">
          <div>
            Built for print. Scan-tested at standard density (error correction
            Q).
          </div>
          <div className="flex gap-4">
            <a
              href="https://github.com/texastentialism/qr-forever"
              className="hover:text-[var(--color-ink)] transition-colors"
            >
              Source on GitHub
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}

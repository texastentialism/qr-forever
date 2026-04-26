"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, KeyRound, Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import {
  clearSyncToken,
  getDeviceLabel,
  getSyncToken,
  setDeviceLabel,
  setSyncToken,
  validateToken,
} from "@/lib/sync";

export default function SignInPage() {
  const [token, setToken] = useState("");
  const [label, setLabel] = useState("");
  const [status, setStatus] = useState<"idle" | "verifying" | "ok" | "bad">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    if (getSyncToken()) setSignedIn(true);
    const lbl = getDeviceLabel();
    if (lbl) setLabel(lbl);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("verifying");
    setError(null);
    const trimmed = token.trim();
    if (!trimmed) {
      setStatus("bad");
      setError("Enter the family token");
      return;
    }
    // Temporarily stash so validateToken can pick it up
    setSyncToken(trimmed);
    const ok = await validateToken(trimmed);
    if (!ok) {
      clearSyncToken();
      setStatus("bad");
      setError("That token didn't work. Double-check with whoever shared it.");
      return;
    }
    if (label.trim()) setDeviceLabel(label.trim());
    setStatus("ok");
    setSignedIn(true);
  }

  function handleSignOut() {
    clearSyncToken();
    setSignedIn(false);
    setToken("");
    setStatus("idle");
  }

  return (
    <main className="flex-1 w-full">
      <div className="mx-auto max-w-lg px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-3 mb-10 hover:opacity-80 transition-opacity"
        >
          <Logo size={36} />
          <div>
            <div className="text-xl font-semibold tracking-tight">
              QR Forever
            </div>
            <div className="text-xs text-[var(--color-ink-muted)]">Back to generator</div>
          </div>
        </Link>

        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-line)] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="size-10 rounded-full bg-[var(--color-surface-soft)] grid place-items-center">
              <KeyRound className="size-5 text-[var(--color-ink-soft)]" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Family sync</h1>
              <p className="text-xs text-[var(--color-ink-muted)]">
                Share QR history across devices with the people you trust.
              </p>
            </div>
          </div>

          {signedIn ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm">
                <Check className="size-4" />
                You&apos;re signed in. Every QR you download here now syncs to
                the shared family space.
              </div>
              <div className="flex gap-2">
                <Link
                  href="/admin"
                  className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-[var(--color-espresso)] text-[var(--color-paper)] hover:bg-[var(--color-espresso-hover)] transition-colors text-sm font-medium"
                >
                  View family history
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-4 py-2.5 rounded-xl border border-[var(--color-line-strong)] hover:bg-[var(--color-surface-soft)] text-sm text-[var(--color-ink-soft)] transition-colors"
                >
                  Sign out
                </button>
              </div>
              <details className="text-xs text-[var(--color-ink-muted)]">
                <summary className="cursor-pointer">Device label</summary>
                <div className="mt-2 space-y-2">
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder='e.g. "Tyler MacBook" or "Sister iPhone"'
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-line-strong)] text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (label.trim()) setDeviceLabel(label.trim());
                    }}
                    className="px-3 py-1.5 rounded-lg border border-[var(--color-line-strong)] text-xs hover:bg-[var(--color-surface-soft)]"
                  >
                    Save label
                  </button>
                  <p className="text-xs text-[var(--color-ink-muted)]">
                    Appears in the admin timeline so you know which device made
                    each QR.
                  </p>
                </div>
              </details>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="family-token"
                  className="block text-sm font-medium text-[var(--color-ink-soft)] mb-1.5"
                >
                  Family token
                </label>
                <input
                  id="family-token"
                  type="text"
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="porchlight-xxxxxxxx"
                  className={`w-full px-4 py-2.5 rounded-xl border font-mono text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors ${
                    status === "bad"
                      ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                      : "border-[var(--color-line-strong)] focus:border-[var(--color-espresso)] focus:ring-[var(--color-espresso)]"
                  }`}
                />
                {error && (
                  <p className="mt-1.5 text-xs text-red-600">{error}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="device-label"
                  className="block text-sm font-medium text-[var(--color-ink-soft)] mb-1.5"
                >
                  Device label{" "}
                  <span className="font-normal text-[var(--color-ink-faint)] text-xs">
                    — optional
                  </span>
                </label>
                <input
                  id="device-label"
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Sister iPhone"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-line-strong)] text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--color-espresso)] focus:border-[var(--color-espresso)]"
                />
                <p className="mt-1.5 text-xs text-[var(--color-ink-muted)]">
                  So you can tell whose QR is whose in the family history.
                </p>
              </div>

              <button
                type="submit"
                disabled={status === "verifying"}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--color-espresso)] text-[var(--color-paper)] hover:bg-[var(--color-espresso-hover)] disabled:opacity-60 transition-colors text-sm font-medium"
              >
                {status === "verifying" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Verifying…
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-[var(--color-line)] text-xs text-[var(--color-ink-muted)] space-y-2 leading-relaxed">
            <p>
              <strong className="text-[var(--color-ink-soft)]">How this works:</strong> your
              local history stays local. Signing in additionally mirrors each
              downloaded QR to a shared cloud space that you and anyone else
              with this token can see at <code>/admin</code>.
            </p>
            <p>
              Don&apos;t have a token? This is currently family-only. If
              you&apos;re Tyler or someone he invited, ask him for the token.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

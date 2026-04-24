/**
 * Client-side sync helper — posts local history entries to /api/sync
 * when the user is signed in to the family space.
 */

import type { HistoryEntry } from "./history";

const TOKEN_KEY = "qrf.sync.token.v1";
const LABEL_KEY = "qrf.sync.label.v1";

export function getSyncToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setSyncToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearSyncToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
}

export function getDeviceLabel(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LABEL_KEY);
}

export function setDeviceLabel(label: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LABEL_KEY, label);
}

export async function syncEntry(
  entry: HistoryEntry
): Promise<{ ok: true } | { ok: false; error: string }> {
  const token = getSyncToken();
  if (!token) return { ok: false, error: "Not signed in" };
  const label = getDeviceLabel() ?? undefined;
  try {
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...entry,
        deviceLabel: label,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `${res.status}: ${body.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function fetchFamilyHistory(): Promise<
  | { ok: true; entries: HistoryEntry[] }
  | { ok: false; error: string; status?: number }
> {
  const token = getSyncToken();
  if (!token) return { ok: false, error: "Not signed in" };
  try {
    const res = await fetch("/api/sync", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `${res.status}: ${await res.text()}`,
        status: res.status,
      };
    }
    const data = (await res.json()) as { entries: HistoryEntry[] };
    return { ok: true, entries: data.entries ?? [] };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function validateToken(token: string): Promise<boolean> {
  try {
    const res = await fetch("/api/sync", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

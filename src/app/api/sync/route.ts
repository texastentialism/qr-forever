/**
 * Family sync API — stores shared history in a private GitHub Gist.
 *
 * Why Gist (not KV/Postgres/Supabase):
 * - No additional service signup or provisioning dashboard step
 * - Free forever at family scale (GitHub API: 5000 req/hr per token)
 * - Auto-backed-up (GitHub itself is the backup)
 * - Tyler can manually view/edit the gist if we ever need a break-glass
 *
 * Auth model:
 * - Client sends a shared token in the Authorization header
 * - Server compares to FAMILY_TOKEN env var (constant-time compare)
 * - Anyone who knows the token can read + write the family history
 * - Appropriate for family-scope (Tyler + sister). For broader use, swap
 *   for email magic link via Resend (see Obsidian Phase-2-Proposal.md).
 */
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SyncEntry = {
  id: string;
  url: string;
  createdAt: number;
  style: Record<string, unknown>;
  deviceLabel?: string;
  deviceHint?: string;
};

type GistContent = {
  entries: SyncEntry[];
};

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function checkAuth(req: NextRequest): { ok: true } | { ok: false; error: string; status: number } {
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return { ok: false, error: "Missing Authorization header", status: 401 };
  const provided = match[1].trim();
  let expected: string;
  try {
    expected = env("FAMILY_TOKEN");
  } catch (e) {
    return { ok: false, error: `Server config: ${(e as Error).message}`, status: 500 };
  }
  if (!timingSafeEqual(provided, expected)) {
    return { ok: false, error: "Invalid token", status: 401 };
  }
  return { ok: true };
}

async function readGist(): Promise<GistContent> {
  const gistId = env("FAMILY_GIST_ID");
  const token = env("GH_SYNC_TOKEN");
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    // Gist data mustn't be cached
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`GitHub gist read failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as {
    files: Record<string, { content: string } | undefined>;
  };
  const content = data.files?.["history.json"]?.content ?? "";
  try {
    const parsed = JSON.parse(content) as GistContent;
    if (!parsed || !Array.isArray(parsed.entries)) return { entries: [] };
    return parsed;
  } catch {
    return { entries: [] };
  }
}

async function writeGist(content: GistContent): Promise<void> {
  const gistId = env("FAMILY_GIST_ID");
  const token = env("GH_SYNC_TOKEN");
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      files: {
        "history.json": { content: JSON.stringify(content, null, 2) },
      },
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`GitHub gist write failed: ${res.status} ${await res.text()}`);
  }
}

const MAX_ENTRIES = 500; // safety cap — gist has 10 MB limit, we won't come close
const MAX_URL_LEN = 2048;

function isValidEntry(e: unknown): e is SyncEntry {
  if (!e || typeof e !== "object") return false;
  const obj = e as Record<string, unknown>;
  return (
    typeof obj.id === "string" &&
    obj.id.length > 0 &&
    obj.id.length < 100 &&
    typeof obj.url === "string" &&
    obj.url.length > 0 &&
    obj.url.length <= MAX_URL_LEN &&
    typeof obj.createdAt === "number" &&
    obj.style !== null &&
    typeof obj.style === "object"
  );
}

export async function GET(req: NextRequest) {
  const auth = checkAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const data = await readGist();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 502 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = checkAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!isValidEntry(body)) {
    return NextResponse.json(
      { error: "Body must be a valid entry" },
      { status: 400 }
    );
  }
  try {
    const current = await readGist();
    // Dedupe by id — if already present, skip (idempotent)
    if (current.entries.some((e) => e.id === body.id)) {
      return NextResponse.json({ ok: true, dedup: true });
    }
    // Dedupe by consecutive identical URL+style (same as local)
    const last = current.entries[0];
    if (
      last &&
      last.url === body.url &&
      JSON.stringify(last.style) === JSON.stringify(body.style)
    ) {
      return NextResponse.json({ ok: true, dedup: true });
    }
    const next: GistContent = {
      entries: [body, ...current.entries].slice(0, MAX_ENTRIES),
    };
    await writeGist(next);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 502 }
    );
  }
}

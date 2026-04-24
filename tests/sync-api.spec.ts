/**
 * Phase 2 sync API: auth, read, write, dedupe.
 *
 * Needs env vars (loaded from .env.local via Next during dev):
 *   FAMILY_TOKEN, FAMILY_GIST_ID, GH_SYNC_TOKEN
 */
import { test, expect } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";

function readEnv(): Record<string, string> {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return {};
  const out: Record<string, string> = {};
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)="?(.*?)"?$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

const env = readEnv();
const TOKEN = env.FAMILY_TOKEN;

test.describe("Family sync API", () => {
  test.skip(!TOKEN, "No FAMILY_TOKEN in .env.local — skipping");

  test("GET /api/sync rejects missing auth", async ({ request }) => {
    const res = await request.get("/api/sync");
    expect(res.status()).toBe(401);
  });

  test("GET /api/sync rejects wrong token", async ({ request }) => {
    const res = await request.get("/api/sync", {
      headers: { Authorization: "Bearer definitely-wrong" },
    });
    expect(res.status()).toBe(401);
  });

  test("GET /api/sync with valid token returns entries array", async ({
    request,
  }) => {
    const res = await request.get("/api/sync", {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.entries)).toBe(true);
  });

  test("POST /api/sync validates entry shape", async ({ request }) => {
    const res = await request.post("/api/sync", {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      data: { garbage: true },
    });
    expect(res.status()).toBe(400);
  });

  test("POST /api/sync appends, GET returns it", async ({ request }) => {
    const uniqueId = `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const entry = {
      id: uniqueId,
      url: `https://example.com/sync-api-test/${uniqueId}`,
      createdAt: Date.now(),
      style: {
        presetId: "print-classic",
        dotColor: "#000000",
        bgColor: "#FFFFFF",
        bgTransparent: false,
        dotType: "square",
        cornerSquareType: "square",
        cornerDotType: "square",
        ecLevel: "Q",
        margin: 8,
        logoSize: 0.3,
        logoHideDots: true,
      },
      deviceLabel: "playwright-test",
    };
    const postRes = await request.post("/api/sync", {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      data: entry,
    });
    expect(postRes.status()).toBe(200);
    const getRes = await request.get("/api/sync", {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const body = await getRes.json();
    const found = body.entries.find(
      (e: { id: string }) => e.id === uniqueId
    );
    expect(found).toBeTruthy();
    expect(found.url).toBe(entry.url);
  });

  test("POST /api/sync dedupes by id (idempotent)", async ({ request }) => {
    const uniqueId = `test-dedup-${Date.now()}`;
    const entry = {
      id: uniqueId,
      url: "https://example.com/dedup",
      createdAt: Date.now(),
      style: {
        presetId: "print-classic",
        dotColor: "#000",
        bgColor: "#FFF",
        bgTransparent: false,
        dotType: "square",
        cornerSquareType: "square",
        cornerDotType: "square",
        ecLevel: "Q",
        margin: 8,
        logoSize: 0.3,
        logoHideDots: true,
      },
    };
    for (let i = 0; i < 2; i++) {
      const res = await request.post("/api/sync", {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
        data: entry,
      });
      expect(res.status()).toBe(200);
    }
    const getRes = await request.get("/api/sync", {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const body = await getRes.json();
    const matching = body.entries.filter(
      (e: { id: string }) => e.id === uniqueId
    );
    expect(matching).toHaveLength(1);
  });
});

test.describe("Sign-in page", () => {
  test("renders form when not signed in", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByText(/Family sync/i)).toBeVisible();
    await expect(page.getByLabel(/Family token/i)).toBeVisible();
  });

  test("rejects bad token with error message", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel(/Family token/i).fill("nope-not-real");
    await page.getByRole("button", { name: /Sign in/i }).click();
    await expect(page.getByText(/token didn't work/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});

test.describe("Admin page", () => {
  test("redirects unsigned users to sign in", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByText(/Sign in required/i)).toBeVisible();
  });
});

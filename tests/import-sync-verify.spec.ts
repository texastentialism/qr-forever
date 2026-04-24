/**
 * End-to-end verification of the import-sync flow against the live site.
 *
 * Simulates: user signs in, imports a JSON backup, expects entries to
 * backfill to the family cloud. This is the exact flow Tyler will run
 * when he imports sister's JSON.
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

const TOKEN = readEnv().FAMILY_TOKEN;

test.describe("Import sync — end-to-end prod verification", () => {
  test.skip(!TOKEN, "No FAMILY_TOKEN in .env.local");

  test("signed-in user imports JSON → entries backfill to family cloud", async ({
    page,
    request,
    baseURL,
  }, testInfo) => {
    // Unique IDs for this run so we don't collide with prior test data
    const runId = Math.random().toString(36).slice(2, 8);
    const id1 = `import-e2e-${runId}-alpha`;
    const id2 = `import-e2e-${runId}-beta`;

    // Build the JSON payload
    const payload = {
      app: "qr-forever",
      version: 1,
      exportedAt: new Date().toISOString(),
      entries: [
        {
          id: id1,
          url: `https://www.porchlightstudios.co/?utm_source=qr&utm_medium=playbill&utm_campaign=playbill-may-2026&_test=${runId}`,
          createdAt: Date.now() - 5000,
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
        },
        {
          id: id2,
          url: `https://www.porchlightstudios.co/contact?_test=${runId}`,
          createdAt: Date.now(),
          style: {
            presetId: "warm",
            dotColor: "#3B2A1A",
            bgColor: "#F7F1E8",
            bgTransparent: false,
            dotType: "rounded",
            cornerSquareType: "extra-rounded",
            cornerDotType: "dot",
            ecLevel: "Q",
            margin: 8,
            logoSize: 0.3,
            logoHideDots: true,
          },
        },
      ],
    };
    const fixturePath = path.join(testInfo.outputDir, "import.json");
    fs.mkdirSync(testInfo.outputDir, { recursive: true });
    fs.writeFileSync(fixturePath, JSON.stringify(payload, null, 2));

    // 1. Sign in
    await page.goto(`${baseURL}/sign-in`);
    await page.getByLabel(/Family token/i).fill(TOKEN!);
    await page.getByLabel(/Device label/i).fill("playwright-e2e");
    await page.getByRole("button", { name: /Sign in/i }).click();
    await expect(page.getByText(/You're signed in/i)).toBeVisible({
      timeout: 15000,
    });

    // 2. Back to home page
    await page.goto(`${baseURL}/`);

    // 3. Import the JSON via file input
    // The import button is visually-invisible <input type="file">; we
    // target it directly. It's aria-labeled "Import QR history JSON file".
    const fileInput = page.locator('input[type="file"][accept*="json"]');
    await fileInput.setInputFiles(fixturePath);

    // 4. Expect the sync toast (either "Synced 2 entries" or "Synced 2, 0 failed")
    await expect(
      page.getByText(/Synced (2|1) (entr|entries)/i)
    ).toBeVisible({ timeout: 15_000 });

    // 5. Hit the API directly with the family token and confirm both IDs are there
    const res = await request.get(`${baseURL}/api/sync`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const ids = new Set(body.entries.map((e: { id: string }) => e.id));
    expect(ids.has(id1), `Expected ${id1} in family cloud`).toBe(true);
    expect(ids.has(id2), `Expected ${id2} in family cloud`).toBe(true);
  });
});

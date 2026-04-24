/**
 * Tests for the history panel and FAQ section.
 */
import { test, expect } from "@playwright/test";

test.describe("History (localStorage)", () => {
  test("starts empty, fills after download, reloads on click", async ({
    page,
  }) => {
    await page.goto("/");

    // Empty state message
    await expect(
      page.getByText("Your recent QRs will show up here")
    ).toBeVisible();

    // Generate + download
    const url = "https://porchlightstudios.com/first-qr";
    await page.getByLabel("Destination URL").fill(url);
    const download1 = page.waitForEvent("download");
    await page.getByRole("button", { name: /PNG · 1024/i }).click();
    await download1;

    // Scope to the history list
    const historyList = page.locator("section").filter({
      has: page.getByRole("heading", { name: /Your recent QRs/i }),
    });
    await expect(historyList.getByText("porchlightstudios.com").first()).toBeVisible();
    await expect(historyList.getByText(/just now/i).first()).toBeVisible();

    // Clear URL, then click the history entry to reload
    await page.getByLabel("Destination URL").fill("");
    await expect(page.getByText("Preview unlocks once")).toBeVisible();

    // Click the recent entry (the load-config button)
    await historyList
      .getByRole("button", { name: /porchlightstudios\.com/i })
      .first()
      .click();
    // URL should restore
    await expect(page.getByLabel("Destination URL")).toHaveValue(url);
  });

  test("dedupes identical consecutive entries", async ({ page }) => {
    await page.goto("/");
    const url = "https://example.com/dedupe-test";
    await page.getByLabel("Destination URL").fill(url);

    for (let i = 0; i < 3; i++) {
      const dl = page.waitForEvent("download");
      await page.getByRole("button", { name: /PNG · 1024/i }).click();
      await dl;
      await page.waitForTimeout(50);
    }

    // Count entries matching hostname — should be 1, not 3
    const entries = page.locator("li").filter({ hasText: "example.com" });
    await expect(entries).toHaveCount(1);
  });

  test("remove button deletes a single entry", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Destination URL").fill("https://example.com/remove-me");
    const dl = page.waitForEvent("download");
    await page.getByRole("button", { name: /PNG · 1024/i }).click();
    await dl;

    const entry = page.locator("li").filter({ hasText: "example.com" });
    await expect(entry).toHaveCount(1);

    // Hover to reveal remove button, then click (exact "Remove" label)
    await entry.hover();
    await entry.getByRole("button", { name: "Remove", exact: true }).click();

    await expect(
      page.getByText("Your recent QRs will show up here")
    ).toBeVisible();
  });
});

test.describe("FAQ", () => {
  test("all FAQ questions are present and expandable", async ({ page }) => {
    await page.goto("/");

    const expectedQuestions = [
      "how long does this QR actually work",
      "track who scans it",
      "change where it goes",
      "try a different design",
      "free",
      "doesn't scan",
    ];

    for (const q of expectedQuestions) {
      await expect(
        page.getByText(new RegExp(q, "i")).first()
      ).toBeVisible();
    }

    // Expand the first one and verify body text appears
    await page.getByText(/how long does this QR/i).click();
    await expect(
      page.getByText(/baked into the pixels/i)
    ).toBeVisible();
  });
});

test.describe("Analytics tip", () => {
  test("UTM tip appears near URL input", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/Want to track scans/i)).toBeVisible();
    await expect(page.getByText(/utm_source=qr/i).first()).toBeVisible();
  });
});

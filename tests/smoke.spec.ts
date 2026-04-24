/**
 * Smoke tests: page loads, no console errors, no network failures,
 * core interactions work, mobile layout doesn't explode.
 */
import { test, expect } from "@playwright/test";

test.describe("Smoke tests", () => {
  test("loads with no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "QR Forever" })).toBeVisible();
    // Allow 1 second for any async errors to bubble
    await page.waitForTimeout(1000);
    expect(errors, errors.join("\n")).toHaveLength(0);
  });

  test("preset selection updates the live preview", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Destination URL").fill("https://example.com");

    // Scope to the Style section so "Transparent · black" (preset) doesn't
    // collide with "Transparent · black dots" (download button).
    const styleSection = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: "Style" }) });

    for (const presetLabel of [
      "Transparent · black",
      "White on black",
      "Espresso · cream",
    ]) {
      await styleSection
        .getByRole("button")
        .filter({ hasText: presetLabel })
        .first()
        .click();
      await page.waitForTimeout(150);
      await expect(page.locator("aside svg").first()).toBeVisible();
    }
  });

  test("example button fills a valid URL", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Try an example/i }).click();
    const value = await page.getByLabel("Destination URL").inputValue();
    expect(value).toMatch(/^https?:\/\//);
  });

  test("URL validation shows incomplete for partial input", async ({ page }) => {
    await page.goto("/");
    const input = page.getByLabel("Destination URL");
    await input.fill("not-a-url");
    await expect(page.getByText("incomplete")).toBeVisible();
  });

  // Edge runtime OG routes can be flaky in local Turbopack dev.
  // This test is meaningful against production only.
  test("OG image route returns PNG", async ({ request, baseURL }) => {
    test.skip(
      !process.env.TEST_BASE_URL,
      "Run against production with TEST_BASE_URL to validate OG image"
    );
    const res = await request.get(`${baseURL}/opengraph-image`);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
    const body = await res.body();
    expect(body.length).toBeGreaterThan(1000);
  });

  test("icon.svg route returns SVG", async ({ request }) => {
    const res = await request.get("/icon.svg");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/svg");
  });
});

test.describe("Mobile layout", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("core controls are reachable on iPhone viewport", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByLabel("Destination URL")).toBeVisible();
    await expect(page.getByRole("button", { name: /Try an example/i })).toBeVisible();
    // Preview should be reachable (scroll if needed)
    await page.locator("aside").scrollIntoViewIfNeeded();
    await expect(page.locator("aside")).toBeVisible();
  });
});

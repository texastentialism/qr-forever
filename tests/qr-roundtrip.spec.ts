/**
 * Core product guarantee test: the QR code actually encodes what we say it does.
 *
 * If this test ever fails, the product is broken. Everything else is decoration.
 */
import { test, expect, type Download } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";
import { PNG } from "pngjs";
import jsQR from "jsqr";

const TEST_URLS = [
  "https://porchlightstudios.com/book",
  "https://tylerwig.com/projects/qr-forever",
  "https://example.com/path/with?query=param&other=value",
  "https://a.co", // very short URL
];

async function decodePngToUrl(filepath: string): Promise<string | null> {
  const buf = fs.readFileSync(filepath);
  const png = PNG.sync.read(buf);
  // jsQR expects Uint8ClampedArray (RGBA)
  const data = new Uint8ClampedArray(png.data.buffer, png.data.byteOffset, png.data.byteLength);
  const result = jsQR(data, png.width, png.height);
  return result?.data ?? null;
}

async function saveDownload(download: Download, outDir: string): Promise<string> {
  fs.mkdirSync(outDir, { recursive: true });
  const suggested = download.suggestedFilename();
  const target = path.join(outDir, suggested);
  await download.saveAs(target);
  return target;
}

test.describe("QR roundtrip — core product guarantee", () => {
  for (const url of TEST_URLS) {
    test(`PNG 1024 encodes ${url}`, async ({ page }, testInfo) => {
      const outDir = path.join(testInfo.outputDir, "downloads");

      await page.goto("/");
      await page.getByLabel("Destination URL").fill(url);
      // Wait for the valid-URL checkmark to appear (indicates QR updated)
      await expect(page.locator("svg.lucide-check").first()).toBeVisible();

      const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.getByRole("button", { name: /PNG · 1024/i }).click(),
      ]);
      const filepath = await saveDownload(download, outDir);
      expect(fs.existsSync(filepath)).toBe(true);

      const decoded = await decodePngToUrl(filepath);
      expect(decoded).toBe(url);
    });
  }

  test("transparent PNG black variant encodes the URL", async ({ page }, testInfo) => {
    const outDir = path.join(testInfo.outputDir, "downloads");
    const url = "https://porchlightstudios.com";

    await page.goto("/");
    await page.getByLabel("Destination URL").fill(url);
    await expect(page.locator("svg.lucide-check").first()).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page
        .getByRole("button", { name: /Transparent · black dots/i })
        .click(),
    ]);
    const filepath = await saveDownload(download, outDir);

    // For transparent PNG, composite on white before decoding (alpha -> background)
    const buf = fs.readFileSync(filepath);
    const png = PNG.sync.read(buf);
    for (let i = 0; i < png.data.length; i += 4) {
      const a = png.data[i + 3];
      if (a < 255) {
        // blend toward white
        const inv = 255 - a;
        png.data[i] = Math.round((png.data[i] * a + 255 * inv) / 255);
        png.data[i + 1] = Math.round((png.data[i + 1] * a + 255 * inv) / 255);
        png.data[i + 2] = Math.round((png.data[i + 2] * a + 255 * inv) / 255);
        png.data[i + 3] = 255;
      }
    }
    const data = new Uint8ClampedArray(png.data.buffer, png.data.byteOffset, png.data.byteLength);
    const decoded = jsQR(data, png.width, png.height);
    expect(decoded?.data).toBe(url);
  });

  test("PNG 2048 (print size) encodes the URL", async ({ page }, testInfo) => {
    const outDir = path.join(testInfo.outputDir, "downloads");
    const url = "https://porchlightstudios.com/contact";

    await page.goto("/");
    await page.getByLabel("Destination URL").fill(url);
    await expect(page.locator("svg.lucide-check").first()).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: /PNG · 2048/i }).click(),
    ]);
    const filepath = await saveDownload(download, outDir);
    const decoded = await decodePngToUrl(filepath);
    expect(decoded).toBe(url);
  });
});

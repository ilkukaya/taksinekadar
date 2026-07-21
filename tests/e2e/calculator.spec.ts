import { test, expect } from "@playwright/test";

test("calculating a fare for a verified province shows an estimated total", async ({ page }) => {
  await page.goto("/taksi-ucreti-hesaplama/");

  await page.locator('select[name="provinceId"]').selectOption({ label: "İstanbul" });
  await page.locator('input[name="distanceKm"]').fill("10");
  await page.getByRole("button", { name: "Ücreti Hesapla" }).click();

  const result = page.locator("#fare-calculator-result");
  await expect(result).toBeVisible();
  await expect(result).toContainText("Tahmini toplam ücret");
  await expect(result).toContainText("TL");
});

test("selecting an unverified province shows the honest not-yet-verified message instead of a fake price", async ({
  page,
}) => {
  await page.goto("/taksi-ucreti-hesaplama/");

  const bursaOption = page.locator('select[name="provinceId"] option', { hasText: "Bursa" });
  await expect(bursaOption).toContainText("tarife doğrulanmadı");
});

test("province tariff page preselects its own province in the calculator", async ({ page }) => {
  await page.goto("/istanbul-taksi-ucreti/");
  await expect(page.locator("h1")).toHaveText("İstanbul Taksi Ücreti Ne Kadar?");

  const select = page.locator('select[name="provinceId"]');
  await expect(select).toHaveValue("34");
});

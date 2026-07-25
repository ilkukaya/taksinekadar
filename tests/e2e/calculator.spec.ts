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

test("selecting a province with no officially-sourced tariff still shows a price, honestly marked as an estimate", async ({
  page,
}) => {
  await page.goto("/taksi-ucreti-hesaplama/");

  await page.locator('select[name="provinceId"]').selectOption({ label: "Van" });
  await page.locator('input[name="distanceKm"]').fill("10");
  await page.getByRole("button", { name: "Ücreti Hesapla" }).click();

  const result = page.locator("#fare-calculator-result");
  await expect(result).toBeVisible();
  await expect(result).toContainText("Tahmini toplam ücret");
  await expect(result).toContainText("tahmini bir tarife kullanılmıştır");
});

test("province tariff page preselects its own province in the calculator", async ({ page }) => {
  await page.goto("/istanbul-taksi-ucreti/");
  await expect(page.locator("h1")).toHaveText("İstanbul Taksi Ücreti Ne Kadar?");

  const select = page.locator('select[name="provinceId"]');
  await expect(select).toHaveValue("34");
});

test("a province page with no officially-sourced tariff shows an estimated summary, not a blank warning", async ({
  page,
}) => {
  await page.goto("/van-taksi-ucreti/");
  await expect(page.locator("h1")).toHaveText("Van Taksi Ücreti Ne Kadar?");

  const summary = page.locator("main");
  await expect(summary).toContainText("tahmini");
  await expect(summary).toContainText("TL");
  await expect(summary).not.toContainText("Bu il için güncel tarife henüz doğrulanmadı");
});

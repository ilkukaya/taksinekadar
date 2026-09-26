import { test, expect } from "@playwright/test";

test("calculating a fare for a verified province shows a live estimated total", async ({
  page,
}) => {
  await page.goto("/taksi-ucreti-hesaplama/");

  await page.locator('select[name="provinceId"]').selectOption({ label: "İstanbul" });
  await page.locator('input[name="distanceKm"]').fill("10");

  const result = page.locator("[data-calc-result]");
  await expect(result).toBeVisible();
  await expect(result).toContainText("Tahmini ücret");
  await expect(result.locator("[data-out-total]")).toContainText("TL");
  await expect(result).toContainText("İstanbul · 10 km");
});

test("quick distance chips and deep links fill the calculator", async ({ page }) => {
  await page.goto("/taksi-ucreti-hesaplama/?il=ankara&km=7");
  await expect(page.locator('select[name="provinceId"]')).toHaveValue("06");
  await expect(page.locator('input[name="distanceKm"]')).toHaveValue("7");
  await expect(page.locator("[data-out-total]")).toContainText("TL");

  await page.getByRole("button", { name: "25 km" }).click();
  await expect(page.locator('input[name="distanceKm"]')).toHaveValue("25");
  await expect(page.locator("[data-out-caption]")).toContainText("25 km");
});

test("selecting a province with no officially-sourced tariff still shows a price, honestly marked as an estimate", async ({
  page,
}) => {
  await page.goto("/taksi-ucreti-hesaplama/");

  await page.locator('select[name="provinceId"]').selectOption({ label: "Van" });
  await page.locator('input[name="distanceKm"]').fill("10");

  const result = page.locator("[data-calc-result]");
  await expect(result.locator("[data-out-total]")).toContainText("TL");
  await expect(result).toContainText("tahmini bir tarife kullanıldı");
});

test("province tariff page preselects its own province and shows a result immediately", async ({
  page,
}) => {
  await page.goto("/istanbul-taksi-ucreti/");
  await expect(page.locator("h1")).toHaveText("İstanbul Taksi Ücreti Ne Kadar?");

  const select = page.locator('select[name="provinceId"]');
  await expect(select).toHaveValue("34");
  await expect(page.locator("[data-out-total]")).toContainText("TL");
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

test("province page ships FAQPage structured data matching the visible FAQ", async ({ page }) => {
  await page.goto("/ankara-taksi-ucreti/");
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const faq = blocks.map((b) => JSON.parse(b)).find((b) => b["@type"] === "FAQPage");
  expect(faq).toBeTruthy();
  const firstQuestion = faq.mainEntity[0].name as string;
  await expect(page.getByRole("heading", { name: firstQuestion })).toBeVisible();
});

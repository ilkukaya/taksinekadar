import { test, expect } from "@playwright/test";

test("an unknown URL returns a real 404 page, not a soft-404", async ({ page }) => {
  const response = await page.goto("/bu-sayfa-hic-var-olmadi/");
  expect(response?.status()).toBe(404);
  await expect(page.locator("h1")).toHaveText("Sayfa Bulunamadı");
  await expect(page.getByRole("link", { name: "Ana Sayfa", exact: true })).toBeVisible();
});

test("airport and bus terminal pages render with a working calculator", async ({ page }) => {
  await page.goto("/havalimani/istanbul-havalimani/");
  await expect(page.locator("h1")).toContainText("İstanbul Havalimanı");
  await expect(page.locator('select[name="provinceId"]')).toHaveValue("34");

  await page.goto("/otogar/asti-ankara/");
  await expect(page.locator("h1")).toContainText("AŞTİ");
});

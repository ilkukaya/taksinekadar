import { test, expect } from "@playwright/test";

test("homepage loads with the correct H1 and brand name", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Taksi Ne Kadar\?/);
  await expect(page.locator("h1")).toHaveText("Taksi Ne Kadar Tutar?");
});

test("homepage links to the 81 provinces list", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Tüm İlleri Gör/ }).click();
  await expect(page).toHaveURL(/\/iller\/$/);
  await expect(page.locator("h1")).toHaveText("Türkiye'nin 81 İli");
});

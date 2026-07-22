import { test, expect } from "@playwright/test";

test("district taxi-stand page lists real stands with a working map link", async ({ page }) => {
  await page.goto("/adana/ceyhan/taksi-duraklari/");

  await expect(page.locator("h1")).toContainText("Ceyhan");
  await expect(page.locator("h1")).toContainText("Adana");

  const firstStand = page.locator("[id]").first();
  await expect(firstStand).toBeVisible();
  await expect(page.getByRole("link", { name: "Haritada ara →" }).first()).toBeVisible();
});

test("province taxi-stand index links through to a district page", async ({ page }) => {
  await page.goto("/adana/taksi-duraklari/");

  await expect(page.locator("h1")).toHaveText("Adana Taksi Durakları");
  await page
    .getByRole("link", { name: /Ceyhan/ })
    .first()
    .click();

  await expect(page).toHaveURL(/\/adana\/ceyhan\/taksi-duraklari\/$/);
});

test("top-level taxi-duraklari index links to a province page", async ({ page }) => {
  await page.goto("/taksi-duraklari/");

  await expect(page.locator("h1")).toHaveText("Taksi Durakları");
  await page.getByRole("link", { name: /Adana/ }).first().click();

  await expect(page).toHaveURL(/\/adana\/taksi-duraklari\/$/);
});

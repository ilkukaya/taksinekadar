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

test("individual stand page has its own URL with a working tel: link", async ({ page }) => {
  await page.goto("/adana/ceyhan/taksi-duraklari/");
  await page.getByRole("link", { name: "Ceyhan Ada Taksi" }).click();

  await expect(page).toHaveURL(/\/adana\/ceyhan\/ceyhan-ada-taksi-duragi\/$/);
  await expect(page.locator("h1")).toHaveText("Ceyhan Ada Taksi");
  // The number appears twice by design (info card + "nasıl çağrılır" step list).
  await expect(page.locator('a[href^="tel:"]').first()).toBeVisible();
});

test("individual stand page shows an FAQ, sibling stands, and district fare info", async ({
  page,
}) => {
  await page.goto("/adana/ceyhan/ceyhan-ada-taksi-duragi/");

  await expect(page.getByRole("heading", { name: "Sık Sorulan Sorular" })).toBeVisible();
  await expect(page.getByText("Ceyhan Ada Taksi nerede?")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Diğer Taksi Durakları/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Taksi Ücretleri/ })).toBeVisible();

  const schemaBlocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(schemaBlocks.some((block) => JSON.parse(block)["@type"] === "FAQPage")).toBe(true);
});

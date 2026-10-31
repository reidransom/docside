import { expect, test } from '@playwright/test';

test('navigation keeps the selected palette while fresh theme JSON loads', async ({ page }) => {
  await page.goto('/');
  await page.locator('#color-mode').selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const background = await page.locator('body').evaluate((body) => getComputedStyle(body).backgroundColor);
  const destination = await page.locator('main a[href]:not([href^="#"]):not([href*=":"])').first().getAttribute('href');

  let releaseRegistry;
  let releasePalette;
  const registryGate = new Promise((resolve) => { releaseRegistry = resolve; });
  const paletteGate = new Promise((resolve) => { releasePalette = resolve; });
  await page.route('**/assets/themes/index.json', async (route) => {
    await registryGate;
    await route.continue();
  });
  await page.route('**/assets/themes/dark.json', async (route) => {
    await paletteGate;
    const response = await route.fetch();
    await route.fulfill({ response, json: { ...await response.json(), bg: '#123456' } });
  });

  try {
    await page.goto(destination, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('body')).toHaveCSS('background-color', background);
    await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark');
    releaseRegistry();
    await expect(page.locator('#color-mode')).toBeVisible();
    await expect(page.locator('body')).toHaveCSS('background-color', background);
    releasePalette();
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(18, 52, 86)');
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('html')).toHaveCSS('color-scheme', 'light');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  } finally {
    releaseRegistry();
    releasePalette();
  }
});

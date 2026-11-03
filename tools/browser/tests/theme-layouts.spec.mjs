import { readFileSync } from 'node:fs';
import { expect, test } from './fixtures.mjs';

const registry = JSON.parse(readFileSync(new URL('../../../assets/themes/index.json', import.meta.url)));
const guide = readFileSync(new URL('../../../docs/color-modes.md', import.meta.url), 'utf8');
const authorPalette = JSON.parse(guide.match(/```json\s*\n([\s\S]*?)```/)[1]);
const routes = [['documentation', '/'], ['splash', '/minimal-hero/'], ['not-found', '/404.html']];

for (const prefix of ['', '/docs']) {
  for (const [layout, path] of routes) {
    test(`${prefix || '/'} ${layout} is Light without JavaScript and restores Dark before paint`, async ({ page, createLocalContext }) => {
      const context = await createLocalContext({ javaScriptEnabled: false, colorScheme: 'dark' });
      const noJS = await context.newPage();
      await noJS.goto(`${prefix}${path}`);
      await expect(noJS.locator('#page-title')).toBeVisible();
      await expect(noJS.locator('#mode-picker')).toBeHidden();
      const light = await noJS.locator('body').evaluate((body) => {
        const style = getComputedStyle(body);
        return { background: style.backgroundColor, foreground: style.color };
      });
      expect(light.background).not.toBe(light.foreground);
      await expect(noJS.locator('html')).toHaveAttribute('data-theme', 'light');
      await page.addInitScript(() => {
        localStorage.setItem('starlight-theme', 'dark');
        window.paintedTheme = null;
        new PerformanceObserver((list) => {
          if (list.getEntries().some((entry) => entry.name === 'first-contentful-paint')) {
            const root = document.documentElement;
            window.paintedTheme = {
              theme: root.dataset.theme, dark: root.classList.contains('dark'),
              background: getComputedStyle(document.body).backgroundColor,
            };
          }
        }).observe({ type: 'paint', buffered: true });
      });
      let release;
      const gate = new Promise((resolve) => { release = resolve; });
      await page.route('**/assets/themes/index.json', async (route) => { await gate; await route.continue(); });
      try {
        await page.goto(`${prefix}${path}`, { waitUntil: 'domcontentloaded' });
        await expect.poll(() => page.evaluate(() => window.paintedTheme?.theme)).toBe('dark');
        const paint = await page.evaluate(() => window.paintedTheme);
        expect(paint.dark).toBe(true);
        expect(paint.background).not.toBe(light.background);
        release();
        await expect(page.locator('#color-mode')).toHaveValue('dark');
        await expect(page.locator('#page-title')).toBeVisible();
      } finally { release(); }
    });
  }
}

test('the complete author example renders as a registered custom palette', async ({ page }) => {
  await page.route('**/assets/themes/index.json', (route) => route.fulfill({
    json: [...registry, { id: 'ocean', label: 'Ocean', scheme: 'dark', palette: 'ocean.json' }],
  }));
  await page.route('**/assets/themes/ocean.json', (route) => route.fulfill({ json: authorPalette }));
  await page.goto('/');
  await page.locator('#color-mode').selectOption('ocean');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'ocean');
  await expect(page.locator('html')).toHaveClass(/\bdark\b/);
  await expect(page.locator('#color-mode')).toHaveValue('ocean');
  const painted = await page.locator('body').evaluate((body) => {
    const ctx = document.createElement('canvas').getContext('2d');
    const pixel = (color) => { ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data]; };
    return { background: pixel(getComputedStyle(body).backgroundColor), foreground: pixel(getComputedStyle(body).color) };
  });
  const pixel = (hex) => [...hex.slice(1).match(/../g).map((part) => parseInt(part, 16)), 255];
  expect(painted.background).toEqual(pixel(authorPalette.background));
  expect(painted.foreground).toEqual(pixel(authorPalette.foreground));
});

test('light-scheme custom palettes use the same complete schema and clear back to stock', async ({ page }) => {
  const light = {
    background: '#fff8ed', foreground: '#211b12', card: '#ffffff', 'card-foreground': '#211b12',
    popover: '#ffffff', 'popover-foreground': '#211b12', primary: '#623a0f', 'primary-foreground': '#ffffff',
    secondary: '#f2e3cd', 'secondary-foreground': '#211b12', muted: '#f2e3cd', 'muted-foreground': '#645641',
    accent: '#f2e3cd', 'accent-foreground': '#211b12', destructive: '#b91c1c', border: '#baaa92', input: '#baaa92', ring: '#623a0f',
    sidebar: '#fff8ed', 'sidebar-foreground': '#211b12', 'sidebar-primary': '#623a0f', 'sidebar-primary-foreground': '#ffffff',
    'sidebar-accent': '#f2e3cd', 'sidebar-accent-foreground': '#211b12', 'sidebar-border': '#baaa92', 'sidebar-ring': '#623a0f',
  };
  await page.route('**/assets/themes/index.json', (route) => route.fulfill({
    json: [...registry, { id: 'paper', label: 'Paper', scheme: 'light', palette: 'paper.json' }],
  }));
  await page.route('**/assets/themes/paper.json', (route) => route.fulfill({ json: light }));
  await page.goto('/');
  await page.locator('#color-mode').selectOption('light');
  const stock = await page.locator('body').evaluate((body) => getComputedStyle(body).backgroundColor);
  await page.locator('#color-mode').selectOption('paper');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'paper');
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'light');
  await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 248, 237)');
  await page.locator('#color-mode').selectOption('light');
  await expect(page.locator('body')).toHaveCSS('background-color', stock);
});

test('print is light for stock Dark and every custom palette, then restores screen state', async ({ page }) => {
  await page.goto('/');
  await page.emulateMedia({ media: 'print' });
  const light = await page.locator('body').evaluate((body) => [getComputedStyle(body).backgroundColor, getComputedStyle(body).color]);
  await page.emulateMedia({ media: 'screen' });
  for (const mode of ['dark', 'punk', 'ice']) {
    await page.locator('#color-mode').selectOption(mode);
    await expect(page.locator('html')).toHaveAttribute('data-theme', mode);
    const screen = await page.locator('body').evaluate((body) => [getComputedStyle(body).backgroundColor, getComputedStyle(body).color]);
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
    await expect(page.locator('body')).toHaveCSS('background-color', light[0]);
    await expect(page.locator('body')).toHaveCSS('color', light[1]);
    await page.emulateMedia({ media: 'screen' });
    await expect(page.locator('body')).toHaveCSS('background-color', screen[0]);
    await expect(page.locator('body')).toHaveCSS('color', screen[1]);
    await expect(page.locator('#color-mode')).toHaveValue(mode);
  }
});

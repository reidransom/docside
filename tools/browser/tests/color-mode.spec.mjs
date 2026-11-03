import { readFileSync } from 'node:fs';
import { expect, test } from './fixtures.mjs';

const themesRoot = new URL('../../../assets/themes/', import.meta.url);
const punk = JSON.parse(readFileSync(new URL('punk.json', themesRoot)));
const registry = JSON.parse(readFileSync(new URL('index.json', themesRoot)));
const rgb = (hex) => `rgb(${hex.slice(1).match(/../g).map((part) => parseInt(part, 16)).join(', ')})`;
const gate = () => {
  let release;
  const promise = new Promise((resolve) => { release = resolve; });
  return { promise, release };
};
const colors = (page) => page.evaluate(() => {
  const pair = (selector) => {
    const style = getComputedStyle(document.querySelector(selector));
    return [style.backgroundColor, style.color];
  };
  return { body: pair('body'), header: pair('.site-header'), current: pair('#site-nav a[aria-current=page]') };
});
const expectTheme = async (page, id, scheme = id) => {
  await expect(page.locator('html')).toHaveAttribute('data-theme', id);
  await expect(page.locator('html')).toHaveAttribute('data-color-scheme', scheme);
  await expect(page.locator('html')).toHaveClass(scheme === 'dark' ? /\bdark\b/ : /^(?!.*\bdark\b)/);
  await expect(page.locator('html')).toHaveCSS('color-scheme', scheme);
};
const recordPaint = (page) => page.addInitScript(() => {
  window.themePaints = [];
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name !== 'first-contentful-paint') continue;
      const root = document.documentElement;
      window.themePaints.push({
        theme: root.dataset.theme,
        scheme: root.dataset.colorScheme,
        dark: root.classList.contains('dark'),
        background: getComputedStyle(document.body).backgroundColor,
        foreground: getComputedStyle(document.body).color,
      });
    }
  }).observe({ type: 'paint', buffered: true });
});

for (const prefix of ['', '/docs']) {
  test(`${prefix || '/'} custom palettes clear completely on stock Light and Dark`, async ({ page }) => {
    await page.goto(`${prefix}/`);
    await page.locator('#color-mode').selectOption('light');
    await expectTheme(page, 'light');
    const light = await colors(page);
    await page.locator('#color-mode').selectOption('dark');
    await expectTheme(page, 'dark');
    const dark = await colors(page);
    expect(dark.body).not.toEqual(light.body);
    for (const custom of ['punk', 'ice']) {
      await page.locator('#color-mode').selectOption(custom);
      await expectTheme(page, custom, 'dark');
      expect((await colors(page)).body).not.toEqual(dark.body);
      for (const [stock, expected] of [['light', light], ['dark', dark]]) {
        await page.locator('#color-mode').selectOption(custom);
        await expectTheme(page, custom, 'dark');
        await page.locator('#color-mode').selectOption(stock);
        await expectTheme(page, stock);
        expect(await colors(page)).toEqual(expected);
        await expect(page.locator('#color-mode')).toHaveValue(stock);
      }
    }
  });

  test(`${prefix || '/'} navigation restores custom colors at first paint before fresh JSON`, async ({ page }) => {
    await page.goto(`${prefix}/`);
    await page.locator('#color-mode').selectOption('punk');
    await expectTheme(page, 'punk', 'dark');
    const background = await page.locator('body').evaluate((body) => getComputedStyle(body).backgroundColor);
    const registryGate = gate();
    const paletteGate = gate();
    await page.route('**/assets/themes/index.json', async (route) => {
      await registryGate.promise;
      await route.continue();
    });
    await page.route('**/assets/themes/punk.json', async (route) => {
      await paletteGate.promise;
      await route.fulfill({ json: { ...punk, background: '#123456' } });
    });
    await recordPaint(page);
    try {
      await page.goto(`${prefix}/guides/long-guide/`, { waitUntil: 'domcontentloaded' });
      await expect.poll(() => page.evaluate(() => window.themePaints)).toEqual([
        { theme: 'punk', scheme: 'dark', dark: true, background, foreground: rgb(punk.foreground) },
      ]);
      await expect(page.locator('body')).toHaveCSS('background-color', background);
      registryGate.release();
      await expect(page.locator('#color-mode')).toBeVisible();
      await expect(page.locator('#color-mode')).toHaveValue('punk');
      await expect(page.locator('body')).toHaveCSS('background-color', background);
      paletteGate.release();
      await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(18, 52, 86)');
      await expectTheme(page, 'punk', 'dark');
      await page.emulateMedia({ media: 'print' });
      await expect(page.locator('html')).toHaveCSS('color-scheme', 'light');
      await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
      await expect(page.locator('body')).toHaveCSS('color', 'rgb(23, 23, 23)');
      await page.emulateMedia({ media: 'screen' });
      await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(18, 52, 86)');
      await expectTheme(page, 'punk', 'dark');
    } finally {
      registryGate.release();
      paletteGate.release();
    }
  });

  test(`${prefix || '/'} registered custom palette URLs stay registry-relative`, async ({ page }) => {
    await page.route('**/assets/themes/index.json', (route) => route.fulfill({
      json: [...registry, { id: 'ocean', label: 'Ocean', scheme: 'dark', palette: 'nested/ocean.json' }],
    }));
    const requested = [];
    await page.route('**/assets/themes/nested/ocean.json', (route) => {
      requested.push(new URL(route.request().url()).pathname);
      return route.fulfill({ json: { ...punk, background: '#123456', foreground: '#ffffff' } });
    });
    await page.goto(`${prefix}/`);
    await page.locator('#color-mode').selectOption('ocean');
    await expectTheme(page, 'ocean', 'dark');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(18, 52, 86)');
    await expect(page.locator('body')).toHaveCSS('color', 'rgb(255, 255, 255)');
    expect(requested).toEqual([`${prefix}/assets/themes/nested/ocean.json`]);
    await page.reload();
    await expect(page.locator('#color-mode')).toHaveValue('ocean');
    await expectTheme(page, 'ocean', 'dark');
  });

  test(`${prefix || '/'} no JavaScript uses readable stock Light`, async ({ createLocalContext }) => {
    const context = await createLocalContext({ javaScriptEnabled: false, colorScheme: 'dark' });
    const page = await context.newPage();
    await page.goto(`${prefix}/`);
    await expect(page.locator('body')).toHaveCSS('background-color', 'oklch(1 0 0)');
    await expect(page.locator('#page-title')).toBeVisible();
    await expect(page.locator('#mode-picker')).toBeHidden();
    await expect(page.locator('html')).toHaveAttribute('data-color-scheme', 'light');
  });
}

for (const preference of ['dark', 'auto']) {
  test(`${preference} restores stock Dark before first paint without a snapshot`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.addInitScript((id) => localStorage.setItem('starlight-theme', id), preference);
    const pending = gate();
    await page.route('**/assets/themes/index.json', async (route) => {
      await pending.promise;
      await route.continue();
    });
    await recordPaint(page);
    try {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await expect.poll(() => page.evaluate(() => window.themePaints[0]?.theme)).toBe('dark');
      const paint = await page.evaluate(() => window.themePaints[0]);
      expect(paint.dark).toBe(true);
      expect(paint.scheme).toBe('dark');
      expect(paint.background).not.toBe('oklch(1 0 0)');
      pending.release();
      await expect(page.locator('#color-mode')).toHaveValue(preference);
      await expectTheme(page, 'dark');
    } finally { pending.release(); }
  });
}

for (const staleResult of ['success', 'failure']) {
  test(`latest selection wins over delayed custom ${staleResult}`, async ({ page }) => {
    const pending = gate();
    await page.route('**/assets/themes/punk.json', async (route) => {
      await pending.promise;
      await route.fulfill(staleResult === 'success' ? { json: punk } : { status: 404 });
    });
    await page.goto('/');
    await page.locator('#color-mode').selectOption('punk');
    await page.locator('#color-mode').selectOption('ice');
    await expectTheme(page, 'ice', 'dark');
    await page.locator('#color-mode').selectOption('light');
    await expectTheme(page, 'light');
    const light = await colors(page);
    const finished = page.waitForResponse('**/assets/themes/punk.json');
    pending.release();
    await finished;
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await expectTheme(page, 'light');
    expect(await colors(page)).toEqual(light);
    await expect(page.locator('#color-mode')).toHaveValue('light');
  });
}

for (const [name, payload] of [
  ['missing', null], ['incomplete', { background: '#000000' }],
  ['unknown', { ...punk, surprise: '#ffffff' }], ['invalid hex', { ...punk, input: '#fff' }],
  ['non-string', { ...punk, input: ['#ffffff'] }],
]) {
  test(`invalid palette (${name}) clears a preceding custom state but retains preference`, async ({ page }) => {
    const errors = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.route('**/assets/themes/ice.json', (route) => route.fulfill(
      payload === null ? { status: 404 } : { json: payload },
    ));
    await page.goto('/');
    await page.locator('#color-mode').selectOption('light');
    const light = await colors(page);
    await page.locator('#color-mode').selectOption('punk');
    await expectTheme(page, 'punk', 'dark');
    await page.locator('#color-mode').selectOption('ice');
    await expectTheme(page, 'light');
    expect(await colors(page)).toEqual(light);
    await expect(page.locator('#color-mode')).toHaveValue('ice');
    expect(await page.evaluate(() => localStorage.getItem('starlight-theme'))).toBe('ice');
    expect(await page.evaluate(() => localStorage.getItem(`docifly-palette:${new URL('assets/themes/index.json', location.origin).href}`))).toBeNull();
    expect(errors.some((error) => error.includes('Unable to load the ice palette'))).toBe(true);
  });
}

for (const [name, payload] of [
  ['missing', null], ['not an array', {}], ['null entry', [null]],
  ['duplicate', [...registry, registry[0]]], ['missing Dark', registry.filter(({ id }) => id !== 'dark')],
  ['custom without palette', [...registry, { id: 'broken', label: 'Broken', scheme: 'dark', palette: null }]],
]) {
  test(`invalid registry (${name}) discards restored custom colors and hides the selector`, async ({ page }) => {
    await page.addInitScript((palette) => {
      localStorage.setItem('starlight-theme', 'punk');
      localStorage.setItem(`docifly-palette:${location.origin}/assets/themes/index.json`, JSON.stringify({
        version: 2, id: 'punk', scheme: 'dark', colors: palette,
      }));
    }, punk);
    const errors = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.route('**/assets/themes/index.json', (route) => route.fulfill(payload === null ? { status: 404 } : { json: payload }));
    await page.goto('/');
    await expectTheme(page, 'light');
    await expect(page.locator('body')).toHaveCSS('background-color', 'oklch(1 0 0)');
    await expect(page.locator('#mode-picker')).toBeHidden();
    expect(errors.some((error) => error.includes('Unable to load the theme registry'))).toBe(true);
    expect(await page.evaluate(() => localStorage.getItem('starlight-theme'))).toBe('punk');
  });
}

for (const [name, snapshot] of [
  ['unversioned', { id: 'punk', scheme: 'dark', colors: punk }],
  ['obsolete', { version: 1, id: 'punk', scheme: 'dark', colors: { bg: '#000000' } }],
  ['incomplete', { version: 2, id: 'punk', scheme: 'dark', colors: { background: '#000000' } }],
  ['mismatched', { version: 2, id: 'ice', scheme: 'dark', colors: punk }],
]) {
  test(`${name} cache cannot color the first paint`, async ({ page }) => {
    await page.addInitScript((snapshot) => {
      localStorage.setItem('starlight-theme', 'punk');
      localStorage.setItem(`docifly-palette:${location.origin}/assets/themes/index.json`, JSON.stringify(snapshot));
    }, snapshot);
    const pending = gate();
    await page.route('**/assets/themes/index.json', async (route) => {
      await pending.promise;
      await route.continue();
    });
    await recordPaint(page);
    try {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await expect.poll(() => page.evaluate(() => window.themePaints[0]?.theme)).toBe('light');
      await expect(page.locator('body')).toHaveCSS('background-color', 'oklch(1 0 0)');
      pending.release();
      await expectTheme(page, 'punk', 'dark');
    } finally { pending.release(); }
  });
}

test('snapshots are isolated by the registry deployment URL', async ({ page }) => {
  await page.goto('/');
  await page.locator('#color-mode').selectOption('punk');
  await expectTheme(page, 'punk', 'dark');
  const pending = gate();
  await page.route('**/docs/assets/themes/index.json', async (route) => { await pending.promise; await route.continue(); });
  try {
    await page.goto('/docs/', { waitUntil: 'domcontentloaded' });
    await expectTheme(page, 'light');
    pending.release();
    await expectTheme(page, 'punk', 'dark');
  } finally { pending.release(); }
});

test('blocked storage keeps switching and Auto functional', async ({ page }) => {
  await page.addInitScript(() => {
    for (const method of ['getItem', 'setItem', 'removeItem']) {
      Storage.prototype[method] = () => { throw new DOMException('Storage denied', 'SecurityError'); };
    }
  });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await page.locator('#color-mode').selectOption('punk');
  await expectTheme(page, 'punk', 'dark');
  await page.locator('#color-mode').selectOption('light');
  await expectTheme(page, 'light');
  await page.locator('#color-mode').selectOption('auto');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expectTheme(page, 'dark');
  await page.reload();
  await expect(page.locator('#color-mode')).toHaveValue('auto');
  await expectTheme(page, 'dark');
});

test('only Auto follows live system appearance, and invalid preferences resolve to Auto', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.addInitScript(() => { if (!localStorage.getItem('starlight-theme')) localStorage.setItem('starlight-theme', 'removed-theme'); });
  await page.goto('/');
  await expect(page.locator('#color-mode')).toHaveValue('auto');
  for (const id of ['light', 'dark', 'punk', 'ice']) {
    await page.locator('#color-mode').selectOption(id);
    await expectTheme(page, id, id === 'light' ? 'light' : 'dark');
    const before = await colors(page);
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.emulateMedia({ colorScheme: 'light' });
    expect(await colors(page)).toEqual(before);
    await expect(page.locator('#color-mode')).toHaveValue(id);
  }
  await page.locator('#color-mode').selectOption('auto');
  await expectTheme(page, 'light');
  expect(await page.evaluate(() => localStorage.getItem('starlight-theme'))).toBeNull();
  await page.emulateMedia({ colorScheme: 'dark' });
  await expectTheme(page, 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expectTheme(page, 'light');
});

test('custom palettes load once per page and stock themes never request a palette', async ({ page }) => {
  const requested = [];
  page.on('request', (request) => {
    if (/\/assets\/themes\/.+\.json$/.test(new URL(request.url()).pathname)) requested.push(new URL(request.url()).pathname);
  });
  await page.goto('/');
  for (const id of ['punk', 'light', 'punk', 'dark', 'punk']) {
    await page.locator('#color-mode').selectOption(id);
    await expectTheme(page, id, id === 'light' ? 'light' : 'dark');
  }
  expect(requested.filter((path) => path.endsWith('/punk.json'))).toHaveLength(1);
  expect(requested.filter((path) => /\/(?:light|dark)\.json$/.test(path))).toEqual([]);
  await expect(page.locator('#color-mode option')).toHaveText(['Dark', 'Light', 'Punk', 'Ice', 'Auto']);
});

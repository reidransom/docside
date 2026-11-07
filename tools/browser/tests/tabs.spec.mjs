import { expect, test } from './fixtures.mjs';

const groupAt = (page, index) => page.locator('[data-tabs]').nth(index);
const tabNamed = (group, name) => group.getByRole('tab', { name, exact: true });
const selected = async (group, name) => {
  await expect(group.getByRole('tab', { selected: true })).toHaveAccessibleName(name);
  const state = await group.evaluate((node) => Array.from(node.querySelectorAll('[role="tab"]'), (tab) => {
    const panel = document.getElementById(tab.getAttribute('aria-controls'));
    return {
      selected: tab.getAttribute('aria-selected') === 'true',
      tabIndex: tab.tabIndex,
      hidden: panel.hidden,
      labelled: panel.getAttribute('aria-labelledby') === tab.id,
    };
  }));
  expect(state.filter((tab) => tab.selected)).toHaveLength(1);
  for (const tab of state) {
    expect(tab.tabIndex).toBe(tab.selected ? 0 : -1);
    expect(tab.hidden).toBe(!tab.selected);
    expect(tab.labelled).toBe(true);
  }
};

for (const prefix of ['', '/docs']) {
  test(`${prefix || '/'} click and keyboard select once, wrap, and retain unique relationships`, async ({ page }) => {
    await page.goto(`${prefix}/tabs/`);
    const group = groupAt(page, 1);
    const ids = await page.getByRole('tab').evaluateAll((tabs) => tabs.map((tab) => tab.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every(Boolean)).toBe(true);
    await selected(group, 'npm');
    await tabNamed(group, 'pnpm').click();
    await selected(group, 'pnpm');
    await expect(tabNamed(group, 'pnpm')).toBeFocused();
    for (const [key, label] of [['ArrowRight', 'Yarn'], ['ArrowRight', 'npm'], ['ArrowLeft', 'Yarn'], ['Home', 'npm'], ['End', 'Yarn']]) {
      await page.keyboard.press(key);
      await selected(group, label);
      await expect(tabNamed(group, label)).toBeFocused();
    }
    await page.reload();
    expect(await page.getByRole('tab').evaluateAll((tabs) => tabs.map((tab) => tab.id))).toEqual(ids);
    await selected(group, 'Yarn');
  });

  test(`${prefix || '/'} exact labels synchronize reordered and partial groups without stealing focus`, async ({ page }) => {
    await page.goto(`${prefix}/tabs/`);
    const independent = groupAt(page, 0);
    const source = groupAt(page, 1);
    const receiver = groupAt(page, 2);
    await tabNamed(source, 'Yarn').click();
    await selected(receiver, 'Yarn');
    await expect(tabNamed(source, 'Yarn')).toBeFocused();
    await tabNamed(source, 'pnpm').click();
    await selected(source, 'pnpm');
    await selected(receiver, 'Yarn');
    await expect(tabNamed(source, 'pnpm')).toBeFocused();
    await tabNamed(receiver, 'npm').click();
    await selected(source, 'npm');
    await expect(tabNamed(receiver, 'npm')).toBeFocused();
    await selected(independent, 'Overview');
    await independent.getByRole('tab').last().click();
    await selected(source, 'npm');
    await page.reload();
    await selected(independent, 'Overview');
    await selected(source, 'npm');
  });

  test(`${prefix || '/'} persistence restores by label across reload and differently ordered pages`, async ({ page }) => {
    await page.goto(`${prefix}/tabs/`);
    const source = groupAt(page, 1);
    await tabNamed(source, 'Yarn').click();
    await source.getByRole('link', { name: 'Continue to the cross-page restoration fixture', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${prefix}/tabs-restoration/$`));
    await selected(groupAt(page, 0), 'Yarn');
    await tabNamed(groupAt(page, 0), 'pnpm').click();
    await page.reload();
    await selected(groupAt(page, 0), 'pnpm');
    await page.goto(`${prefix}/tabs/`);
    await selected(source, 'pnpm');
    // No pnpm in the receiving group: its own first label is the fallback.
    await selected(groupAt(page, 2), 'Yarn');
  });

  test(`${prefix || '/'} labels alone name tabs and Tab reaches content or the plain panel`, async ({ page }) => {
    await page.goto(`${prefix}/tabs/`);
    const independent = groupAt(page, 0);
    const overview = tabNamed(independent, 'Overview');
    await expect(overview.locator('svg')).toHaveAttribute('aria-hidden', 'true');
    await expect(overview.locator('svg')).toHaveAttribute('focusable', 'false');
    const long = independent.getByRole('tab').last();
    await expect(long.locator('svg')).toHaveCount(0);
    await overview.focus();
    await page.keyboard.press('Tab');
    await expect(independent.getByRole('link', { name: 'focusable link', exact: true })).toBeFocused();
    const source = groupAt(page, 1);
    await tabNamed(source, 'npm').click();
    await page.keyboard.press('Tab');
    await expect(source.getByRole('tabpanel')).toBeFocused();
    await expect(source.getByRole('tabpanel')).toHaveAccessibleName('npm');
    await tabNamed(source, 'Yarn').click();
    await page.keyboard.press('Tab');
    await expect(source.getByRole('link', { name: 'Continue to the cross-page restoration fixture', exact: true })).toBeFocused();
  });
}

for (const stored of [null, 'not a known label', 'yarn', '{"label":"Yarn"}']) {
  test(`missing or invalid persisted label ${JSON.stringify(stored)} falls back visibly`, async ({ page }) => {
    if (stored !== null) await page.addInitScript((value) => localStorage.setItem('docside-tabs:v1:package-manager', value), stored);
    await page.goto('/tabs/');
    await selected(groupAt(page, 1), 'npm');
    await selected(groupAt(page, 2), stored === null ? 'npm' : 'Yarn');
    await page.goto('/tabs-restoration/');
    await selected(groupAt(page, 0), 'Yarn');
  });
}

test('nonpersistent synchronization is case-sensitive and resets on reload', async ({ page }) => {
  await page.goto('/tabs/');
  const source = groupAt(page, 3);
  const receiver = groupAt(page, 4);
  await tabNamed(receiver, 'npm').click();
  await selected(source, 'npm');
  await tabNamed(source, 'Yarn').click();
  await selected(receiver, 'npm');
  await expect(tabNamed(source, 'Yarn')).toBeFocused();
  await tabNamed(receiver, 'yarn').click();
  await selected(source, 'Yarn');
  await page.reload();
  await selected(source, 'npm');
  await selected(receiver, 'npm');
});

test('denied storage keeps keyboard, synchronization and reading available', async ({ page }) => {
  await page.addInitScript(() => {
    for (const method of ['getItem', 'setItem']) Object.defineProperty(Storage.prototype, method, {
      value() { throw new DOMException('Storage denied', 'SecurityError'); },
    });
  });
  await page.goto('/tabs/');
  await selected(groupAt(page, 1), 'npm');
  await tabNamed(groupAt(page, 1), 'Yarn').click();
  await selected(groupAt(page, 2), 'Yarn');
  await page.keyboard.press('Home');
  await selected(groupAt(page, 1), 'npm');
  await selected(groupAt(page, 2), 'npm');
  await page.reload();
  await selected(groupAt(page, 1), 'npm');
});

test('RTL arrows reverse and wrap while Home and End retain source-order meaning', async ({ page }) => {
  await page.goto('/localized/ar/dalil/');
  const group = groupAt(page, 0);
  const first = group.getByRole('tab').first();
  const last = group.getByRole('tab').last();
  await first.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(last).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(first).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(last).toBeFocused();
  await page.keyboard.press('Home');
  await expect(first).toBeFocused();
  await page.keyboard.press('End');
  await expect(last).toBeFocused();
  await selected(group, 'Docside API');
  // Three choices distinguish reversed direction from ordinary two-tab wrapping.
  await page.goto('/tabs/');
  await page.evaluate(() => { document.documentElement.dir = 'rtl'; });
  const packages = groupAt(page, 1);
  await tabNamed(packages, 'npm').focus();
  for (const [key, label] of [['ArrowLeft', 'pnpm'], ['ArrowLeft', 'Yarn'], ['ArrowLeft', 'npm'], ['ArrowRight', 'Yarn'], ['Home', 'npm'], ['End', 'Yarn']]) {
    await page.keyboard.press(key);
    await selected(packages, label);
    await expect(tabNamed(packages, label)).toBeFocused();
  }
});

test('an initiating lower group stays anchored when synchronized panel heights change above it', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 600 });
  await page.goto('/tabs/');
  const upper = groupAt(page, 1);
  const lower = groupAt(page, 2);
  await tabNamed(upper, 'Yarn').click();
  await tabNamed(lower, 'Yarn').focus();
  await lower.evaluate((node) => window.scrollTo(0, window.scrollY + node.getBoundingClientRect().top - 250));
  const top = await lower.evaluate((node) => node.getBoundingClientRect().top);
  await page.keyboard.press('End');
  await selected(upper, 'npm');
  await selected(lower, 'npm');
  await expect(tabNamed(lower, 'npm')).toBeFocused();
  expect(Math.abs(await lower.evaluate((node) => node.getBoundingClientRect().top) - top)).toBeLessThanOrEqual(1);
});

for (const theme of ['light', 'dark']) {
  test(`${theme} 320px long labels scroll locally and keyboard selection reveals them`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.addInitScript((mode) => localStorage.setItem('starlight-theme', mode), theme);
    await page.goto('/docs/tabs/');
    const group = groupAt(page, 0);
    const list = group.getByRole('tablist');
    const long = group.getByRole('tab').last();
    expect(await list.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
    await group.getByRole('tab').first().focus();
    await page.keyboard.press('End');
    await expect(long).toBeFocused();
    expect(await list.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  });
}

test('no-JS keeps every labeled section readable in source order', async ({ createLocalContext }) => {
  const context = await createLocalContext({ javaScriptEnabled: false, viewport: { width: 320, height: 844 } });
  const page = await context.newPage();
  await page.goto('/docs/tabs/');
  await expect(page.getByRole('tab')).toHaveCount(0);
  const labels = await page.locator('[data-tabs] h3').allTextContents();
  expect(labels).toEqual(['Overview', 'A deliberately long tab label that scrolls within a narrow tab list', 'npm', 'pnpm', 'Yarn', 'Yarn', 'npm', 'npm', 'Yarn', 'yarn', 'npm']);
  for (const panel of await page.locator('.tab-panel').all()) await expect(panel).toBeVisible();
  await groupAt(page, 1).getByRole('link', { name: 'Continue to the cross-page restoration fixture', exact: true }).click();
  await expect(page).toHaveURL(/\/docs\/tabs-restoration\/$/);
  for (const panel of await page.locator('.tab-panel').all()) await expect(panel).toBeVisible();
});

test('print exposes all labeled panels and restores screen selection', async ({ page }) => {
  await page.goto('/tabs/');
  await tabNamed(groupAt(page, 1), 'pnpm').click();
  await page.emulateMedia({ media: 'print' });
  for (const panel of await page.locator('.tab-panel').all()) await expect(panel).toBeVisible();
  for (const heading of await page.locator('[data-tabs] h3').all()) await expect(heading).toBeVisible();
  for (const list of await page.getByRole('tablist', { includeHidden: true }).all()) await expect(list).toBeHidden();
  await page.emulateMedia({ media: 'screen' });
  await selected(groupAt(page, 1), 'pnpm');
  await expect(groupAt(page, 1).getByRole('tabpanel')).toBeVisible();
});

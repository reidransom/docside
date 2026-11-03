import { expect, test } from './fixtures.mjs';
import { installations } from '../matrix.mjs';

for (const { name, base } of installations) {
  test(`${name} search follows a specific heading and exposes empty and retry states`, async ({ page }) => {
    let denyCorpus = true;
    await page.route(`**${base}/assets/search-data.json`, async route => {
      if (denyCorpus) await route.fulfill({ status: 503, body: 'Unavailable' });
      else await route.continue();
    });
    await page.goto(`${base}/`);
    await page.locator('#search-toggle').click();
    await expect(page.locator('#search-input')).toBeFocused();
    await expect(page.locator('#search-status')).toContainText('Search could not load. Check your connection and retry.');
    await expect(page.locator('#search-results a')).toHaveCount(0);
    denyCorpus = false;
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await expect(page.locator('#search-status')).toHaveText('Enter words to search this documentation.');
    await page.locator('#search-input').fill('zzzxnonexistentquery');
    await expect(page.locator('#search-status')).toHaveText('No results found. Check spelling or try fewer words.');
    await expect(page.locator('#search-results a')).toHaveCount(0);
    await page.locator('#search-input').fill('Documentation workflow');
    const result = page.getByRole('link', { name: 'Overview — Documentation workflow', exact: true });
    await expect(result).toHaveAttribute('href', `${new URL(page.url()).origin}${base}/#documentation-workflow`);
    // The snippet/padding belongs to the same destination, not a second tiny link.
    await result.locator('p').click();
    await expect(page).toHaveURL(new RegExp(`${base}/#documentation-workflow$`));
    await expect(page.locator('#search-dialog')).not.toBeVisible();
  });

  test(`${name} menu and search retain modal keyboard focus and Escape restoration`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/`);
    await page.locator('#menu-toggle').click();
    await expect.poll(() => page.locator('#main-content').evaluate(node => node.inert)).toBe(true);
    await page.keyboard.press('Control+k');
    await expect(page.locator('#search-input')).toBeFocused();
    await expect.poll(() => page.locator('#site-nav').evaluate(node => node.matches(':popover-open'))).toBe(false);
    await expect.poll(() => page.locator('.site-header').evaluate(node => node.inert)).toBe(false);
    await expect.poll(() => page.locator('#main-content').evaluate(node => node.inert)).toBe(false);
    for (const key of ['Shift+Tab', 'Tab', 'Tab', 'Tab', 'Shift+Tab']) {
      await page.keyboard.press(key);
      await expect.poll(() => page.locator('#search-dialog').evaluate(node => node.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(page.locator('#search-dialog')).not.toHaveAttribute('open', '');
    await expect(page.locator('.search-dialog-frame')).not.toBeVisible();
    await expect(page.locator('#search-toggle')).toBeFocused();
    await expect.poll(() => page.locator('#main-content').evaluate(node => node.inert)).toBe(false);
    await page.locator('#menu-toggle').click();
    await expect(page.locator('#site-nav a').first()).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('#menu-toggle')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('#menu-toggle')).toBeFocused();
  });

  test(`${name} enlarged text relocates one controls instance and restores desktop focus`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${base}/guides/long-guide/`);
    await page.locator('#color-mode').focus();
    await page.evaluate(() => document.documentElement.style.fontSize = '200%');
    await expect(page.locator('#menu-toggle')).toBeVisible();
    await expect(page.locator('#menu-toggle')).toBeFocused();
    await page.locator('#menu-toggle').click();
    await expect(page.locator('#site-nav #color-mode')).toBeVisible();
    await expect(page.locator('#color-mode')).toHaveCount(1);
    await page.locator('#version-picker summary').click();
    await expect(page.locator('#version-picker a')).toHaveText('Legacy documentation release with an intentionally long label');
    await expect(page.locator('#version-picker a')).toHaveAttribute('href', '/legacy/');
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.locator('#color-mode').focus();
    await page.evaluate(() => document.documentElement.style.removeProperty('font-size'));
    await expect(page.locator('header #color-mode')).toBeVisible();
    await expect(page.locator('#color-mode')).toBeFocused();
    await expect(page.locator('#color-mode')).toHaveCount(1);
    await expect.poll(() => page.locator('#main-content').evaluate(node => node.inert)).toBe(false);
  });
}

for (const base of ['/localized', '/localized/docs']) {
  test(`${base} long localized choices remain readable in RTL and compact layouts`, async ({ page }) => {
    for (const width of [320, 800, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${base}/ar/dalil/`);
      await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
      if (width < 800) await page.locator('#menu-toggle').click();
      await page.locator('#language-picker summary').click();
      const french = page.locator('#language-picker a[lang="fr"]');
      await expect(french).toHaveText('Français — documentation détaillée');
      await expect(french).toHaveAttribute('href', `${base}/fr/demarrage/`);
      const bounds = await french.boundingBox();
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
      await expect.poll(() => french.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
      await expect(page.locator('#color-mode option[value="punk"]')).toHaveText('Punk');
      await expect(page.locator('#color-mode option[value="ice"]')).toHaveText('Ice');
      await french.click();
      await expect(page).toHaveURL(new RegExp(`${base}/fr/demarrage/$`));
    }
  });

  test(`${base} language destinations work through native disclosures without JavaScript`, async ({ createLocalContext }) => {
    const context = await createLocalContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(`${base}/fr/demarrage/`);
    await page.locator('#language-picker summary').click();
    await page.locator('#language-picker a[lang="ar"]').click();
    await expect(page).toHaveURL(new RegExp(`${base}/ar/dalil/$`));
    await expect(page.locator('#page-title')).toHaveText('الدليل العربي');
    await expect(page.locator('#search-toggle')).toBeDisabled();
    await page.locator('#menu-toggle').click();
    const group = page.locator('#site-nav details').first();
    await group.locator('summary').click();
    await expect(group).not.toHaveAttribute('open');
    await group.locator('summary').click();
    await expect(group).toHaveAttribute('open');
    await context.close();
  });
}

import { expect, test } from './fixtures.mjs';
import { installations, urlFor } from '../matrix.mjs';
import { miniSearchURL } from '../local-policy.mjs';

for (const installation of installations) {
  test(`${installation.name} real offline search indexes generated content and respects exclusions`, async ({ page }) => {
    await page.goto(urlFor(installation, { path: '/' }));
    await page.locator('#search-toggle').click();
    await expect(page.locator('#search-dialog')).toBeVisible();
    await page.locator('#search-input').fill('Documentation workflow');
    const result = page.locator('#search-results a');
    await expect(result.first()).toContainText('Overview');
    await expect(result.first()).toHaveAttribute('href', new RegExp(`${installation.base}/#documentation-workflow$`));

    // Real generated exclusions: a private document and file-tree-only source text.
    for (const query of ['excluded-body-needle', 'unpublished-body-needle', 'complete-output.txt']) {
      await page.locator('#search-input').fill(query);
      await expect(page.locator('#search-status')).toHaveText('No results found. Check spelling or try fewer words.');
      await expect(result).toHaveCount(0);
    }
    await page.locator('#search-input').fill('Documentation workflow');
    await result.first().click();
    await expect(page).toHaveURL(new RegExp(`${installation.base}/#documentation-workflow$`));
  });

  test(`${installation.name} denied MiniSearch keeps search disabled`, async ({ page, localRequests }) => {
    await page.route(miniSearchURL, async (route) => {
      localRequests.push({ url: route.request().url(), method: 'GET', action: 'denied-minisearch' });
      await route.abort('blockedbyclient');
    });
    await page.goto(urlFor(installation, { path: '/' }));
    await expect(page.locator('#article')).toContainText('Documentation workflow');
    await expect(page.locator('#search-toggle')).toBeDisabled();
    await page.keyboard.press('Control+k');
    await expect(page.locator('#search-dialog')).not.toBeVisible();
  });
}

for (const base of ['/localized', '/localized/docs']) {
  test(`${base} native Arabic corpus searches only its published locale`, async ({ page }) => {
    await page.goto(`${base}/ar/dalil/`);
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await page.locator('#search-toggle').click();
    await page.locator('#search-input').fill('الدليل');
    await expect(page.locator('#search-results a')).toHaveCount(1);
    await expect(page.locator('#search-results a')).toContainText('الدليل العربي');
    await expect(page.locator('#search-results a')).toHaveAttribute('href', new RegExp(`${base}/ar/dalil/`));
    await page.locator('#search-input').fill('English guide');
    await expect(page.locator('#search-results a')).toHaveCount(0);
    await expect(page.locator('#search-status')).toHaveText('لم يتم العثور على نتائج. تحقق من الإملاء أو جرّب كلمات أقل.');
  });
}

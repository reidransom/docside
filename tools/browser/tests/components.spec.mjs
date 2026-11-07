import { expect, test } from './fixtures.mjs';

const literalAction = 'Literal <mark>action</mark> & safe';
const literalCard = 'Literal <mark>card</mark> & safe Literal <em>description</em> & safe';

for (const prefix of ['', '/docs']) {
  test(`${prefix || '/'} omits unsafe links, escapes text and prefixes destinations`, async ({ page }) => {
    await page.goto(`${prefix}/`);
    await expect(page.locator('#article')).not.toContainText('Unsafe action must not render');
    await expect(page.locator('#article')).not.toContainText('Unsafe data action must not render');
    await expect(page.locator('#article')).not.toContainText('Unsafe card must not render');
    await expect(page.locator('#article')).not.toContainText('Unsafe data card must not render');
    const action = page.getByRole('link', { name: literalAction, exact: true });
    await expect(action).toHaveAttribute('href', `${prefix}/cards/`);
    await expect(action.locator('mark')).toHaveCount(0);
    const card = page.getByRole('link', { name: literalCard, exact: true });
    await expect(card).toHaveAttribute('href', `${prefix}/badges/`);
    await expect(card.locator('mark, em, a, button, input')).toHaveCount(0);
    await action.click();
    await expect(page).toHaveURL(new RegExp(`${prefix}/cards/$`));
    const install = page.getByRole('link', { name: 'Install Docside Follow the consumer installation path.', exact: true });
    await install.focus();
    await expect(install).toBeFocused();
    expect(await install.evaluate((node) => getComputedStyle(node).outlineStyle)).not.toBe('none');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`${prefix}/getting-started/$`));
  });

  test(`${prefix || '/'} preserves action semantics, icon order and new-window safety`, async ({ page }) => {
    await page.goto(`${prefix}/link-buttons/`);
    const newWindow = page.getByRole('link', { name: 'Explicit new window', exact: true });
    await expect(newWindow).toHaveAttribute('target', '_blank');
    await expect(newWindow).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(page.getByRole('link', { name: 'External in this window', exact: true })).not.toHaveAttribute('target');
    for (const [name, href] of [['Email documentation', 'mailto:docs@example.com'], ['Telephone support', 'tel:+15550100'], ['Page fragment', '#variants']]) {
      await expect(page.getByRole('link', { name, exact: true })).toHaveAttribute('href', href);
    }
    const leading = page.getByRole('link', { name: 'Leading rocket', exact: true });
    const trailing = page.getByRole('link', { name: 'Trailing arrow', exact: true });
    expect(await leading.evaluate((node) => node.firstElementChild.tagName.toLowerCase())).toBe('svg');
    expect(await trailing.evaluate((node) => node.lastElementChild.tagName.toLowerCase())).toBe('svg');
    await expect(page.getByRole('link', { name: 'Unknown icon keeps this text', exact: true }).locator('svg')).toHaveCount(0);
    await page.getByRole('link', { name: 'Minimal action', exact: true }).click();
    await expect(page).toHaveURL(/#destinations-and-new-windows$/);
  });

  test(`${prefix || '/'} keeps heading fragments and navigation badge names independent`, async ({ page }) => {
    await page.goto(`${prefix}/badges/`);
    const heading = page.getByRole('heading', { name: 'Release status', exact: true });
    await expect(heading).toHaveAttribute('id', 'release-status');
    await expect(heading.locator('.badge')).toHaveCount(0);
    await expect(heading.locator('..').locator('.badge')).toHaveText('Beta!');
    await expect(page.locator('#site-nav').getByRole('link', { name: 'Badges New!', exact: true })).toBeVisible();
    const named = page.locator('#site-nav').getByRole('link', { name: 'Cards, stable', exact: true });
    await expect(named.locator('.badge')).toHaveAttribute('aria-hidden', 'true');
    const toc = page.locator('#toc').getByRole('link', { name: 'Release status', exact: true });
    await expect(toc).toHaveAttribute('href', '#release-status');
    await page.getByRole('link', { name: 'Section titled “Release status”', exact: true }).click();
    await expect(page).toHaveURL(/#release-status$/);
    await expect(heading).toBeInViewport();
    await expect(page.locator('#article .badge mark, #article .badge strong')).toHaveCount(0);
  });

  test(`${prefix || '/'} keeps callouts static, labeled, localized and readable`, async ({ page }) => {
    await page.goto(`${prefix}/callouts/`);
    await expect(page.getByRole('alert')).toHaveCount(0);
    for (const name of ['Note', 'Tip', 'Caution', 'Danger', 'Before deployment', 'Markup stays literal: <mark>safe</mark> & readable']) {
      await expect(page.getByRole('complementary', { name, exact: true }).first()).toBeVisible();
    }
    await expect(page.getByText('This must not render', { exact: true })).toHaveCount(0);
    const custom = page.getByRole('complementary', { name: 'Markup stays literal: <mark>safe</mark> & readable', exact: true });
    await expect(custom.locator('[data-title] mark')).toHaveCount(0);
    await expect(custom.locator('svg')).toHaveAttribute('data-icon', 'star');
    const fallback = page.getByRole('complementary', { name: 'Caution', exact: true }).filter({ hasText: 'unknown icon' });
    await expect(fallback.locator('svg')).toHaveAttribute('data-icon', 'warning');
    await expect(page.locator('#article > blockquote')).toBeVisible();
  });

  test(`${prefix || '/'} scopes nested Markdown without restyling component chrome`, async ({ page }) => {
    await page.goto(`${prefix}/`);
    for (const root of [page.locator('article.card'), page.getByRole('complementary', { name: 'Literal <mark>notice</mark> & safe', exact: true })]) {
      await expect(root.getByRole('heading', { name: 'Nested component prose', exact: true })).toBeVisible();
      await expect(root.getByRole('listitem')).toHaveCount(2);
      const list = root.getByRole('list');
      await expect(list).toHaveCSS('list-style-type', 'disc');
      expect(parseFloat(await list.evaluate((node) => getComputedStyle(node).paddingInlineStart))).toBeGreaterThan(0);
      await expect(root.locator('strong')).toHaveText('strong content');
      await expect(root.getByRole('link', { name: 'the destination', exact: true })).toHaveCSS('text-decoration-line', 'underline');
      await expect(root.getByRole('link', { name: 'Nested action', exact: true })).toHaveCSS('text-decoration-line', 'none');
      expect(parseFloat(await root.locator('blockquote').evaluate((node) => getComputedStyle(node).borderInlineStartWidth))).toBeGreaterThan(0);
      expect(parseFloat(await root.getByRole('heading').evaluate((node) => getComputedStyle(node).fontSize))).toBeGreaterThan(16);
    }
    const title = page.locator('article.card [data-title]');
    await expect(title).toHaveText('Literal <mark>title</mark> & safe');
    await expect(title.locator('mark')).toHaveCount(0);
    expect(parseFloat(await title.evaluate((node) => getComputedStyle(node).marginTop))).toBe(0);
  });
}

test('native steps, icons and RTL components retain their semantics', async ({ page }) => {
  await page.goto('/steps/');
  const later = page.locator('ol[start="8"]');
  await expect(later).toHaveRole('list');
  await expect(later.locator(':scope > li')).toHaveCount(3);
  await expect(later.locator('li').first()).toContainText('Eighth step');
  await page.goto('/icons/');
  await expect(page.getByRole('img', { name: 'Docside <mark>safe</mark> & literal', exact: true })).toBeVisible();
  await expect(page.locator('#article').getByRole('link', { name: 'All icons', exact: true })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Confirm', exact: true })).toBeVisible();
  await expect(page.locator('[data-fixture="unknown"] svg')).toHaveCount(0);
  await expect(page.locator('.icon-sample svg')).toHaveCount(130);
  await page.goto('/localized/ar/dalil/');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('complementary', { name: 'خطر', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'انتقل إلى البداية رابط واحد بترتيب قراءة عربي.', exact: true })).toBeVisible();
  await expect(page.locator('.card article')).toHaveCount(0);
  const arrow = page.getByRole('link', { name: 'ابدأ القراءة', exact: true }).locator('svg');
  expect(await arrow.evaluate((node) => getComputedStyle(node).transform)).toBe('matrix(-1, 0, 0, 1, 0, 0)');
});

test('ordinary cards, notices and native tree disclosures work without JavaScript', async ({ createLocalContext }) => {
  const context = await createLocalContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/docs/cards/');
  await expect(page.locator('article.card').first().getByRole('list')).toHaveCSS('list-style-type', 'disc');
  const card = page.getByRole('link', { name: 'Install Docside Follow the consumer installation path.', exact: true });
  await card.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/docs\/getting-started\/$/);
  await page.goto('/docs/callouts/');
  await expect(page.getByRole('complementary', { name: 'Note', exact: true }).first()).toBeVisible();
  await page.goto('/docs/file-trees/');
  const directory = page.locator('.file-tree summary').filter({ hasText: 'components' }).first();
  await directory.click();
  await expect(page.locator('.file-tree').first().getByText('helper.TS', { exact: true })).toBeVisible();
});

for (const theme of ['light', 'dark', 'punk', 'ice']) {
  test(`${theme} long callout titles and code stay within a narrow reading column`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.addInitScript((mode) => localStorage.setItem('starlight-theme', mode), theme);
    await page.goto('/docs/callouts/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    const notice = page.getByRole('complementary', { name: 'A deliberately long danger title with markup-like <characters> and enough words to wrap at narrow widths', exact: true });
    await notice.scrollIntoViewIfNeeded();
    await expect(notice).toBeInViewport();
    const geometry = await notice.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      const code = node.querySelector('pre');
      return { page: document.documentElement.scrollWidth, width: innerWidth, left: rect.left, right: rect.right, codeWidth: code.clientWidth, codeScroll: code.scrollWidth, overflow: getComputedStyle(code).overflowX };
    });
    expect(geometry.page).toBeLessThanOrEqual(geometry.width);
    expect(geometry.left).toBeGreaterThanOrEqual(0);
    expect(geometry.right).toBeLessThanOrEqual(geometry.width);
    expect(geometry.codeScroll).toBeGreaterThan(geometry.codeWidth);
    expect(geometry.overflow).toBe('auto');
  });
}

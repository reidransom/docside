import { expect, test } from './fixtures.mjs';

for (const prefix of ['', '/docs']) {
  test(`${prefix || '/'} framed marked source survives selection and real clipboard writes`, async ({ createLocalContext, browserName }) => {
    test.skip(browserName !== 'chromium', 'Native clipboard read permissions are verified in Chromium.');
    const context = await createLocalContext({ permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await context.newPage();
    await page.goto(`${prefix}/code/`);
    const frame = page.locator('figure[data-code-frame]').filter({ has: page.locator('.code-title', { hasText: 'deploy.sh' }) });
    const source = "printf 'stable\\n'\nprintf 'added\\n'\nprintf 'removed\\n'\n";
    const code = frame.locator('code');
    await expect(code).toHaveText(source, { useInnerText: false });
    expect(await code.textContent()).toBe(source);
    expect(await code.locator('.code-line').evaluateAll((lines) => lines.map((line) => line.dataset.lineNumber))).toEqual(['8', '9', '10']);
    await code.evaluate((node) => {
      const range = document.createRange();
      range.selectNodeContents(node);
      getSelection().removeAllRanges();
      getSelection().addRange(range);
    });
    // Native selection omits the structural newline after the final block line.
    const selectedSource = "printf 'stable\\n'\nprintf 'added\\n'\nprintf 'removed\\n'";
    expect(await page.evaluate(() => getSelection().toString())).toBe(selectedSource);
    await page.keyboard.press('Control+c');
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(selectedSource);
    await frame.getByRole('button', { name: 'Copy to clipboard' }).click();
    await expect(frame.getByRole('status')).toHaveText('Copied!');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(source);
    expect(await code.textContent()).toBe(source);

    // Deny the actual browser permission, not an echoing Clipboard API replacement.
    // Chromium's clipboard-read grant also permits unsanitized writes. Clear it
    // before denying both write forms, then restore read access for inspection.
    await context.clearPermissions();
    const session = await context.newCDPSession(page);
    for (const allowWithoutSanitization of [false, true]) {
      await session.send('Browser.setPermission', {
        permission: { name: 'clipboard-write', allowWithoutSanitization },
        setting: 'denied', origin: new URL(page.url()).origin,
      });
    }
    await frame.getByRole('button', { name: 'Copy to clipboard' }).click();
    await expect(frame.getByRole('status')).toHaveText('Copy failed');
    await expect(frame.getByRole('status')).toHaveAttribute('data-error', '');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(source);
  });

  test(`${prefix || '/'} RTL articles keep copy controls in the LTR source gutter`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(`${prefix}/code/`);
    await page.locator('#article').evaluate((article) => { article.dir = 'rtl'; });
    const placement = await page.locator('#article .code-frame').first().evaluate((frame) => {
      const pre = frame.querySelector('pre');
      const source = pre.getBoundingClientRect();
      const button = frame.querySelector('.copy-button').getBoundingClientRect();
      return {
        direction: getComputedStyle(pre).direction,
        sourceEnd: source.right - parseFloat(getComputedStyle(pre).paddingRight),
        buttonStart: button.left,
      };
    });
    expect(placement.direction).toBe('ltr');
    expect(placement.buttonStart, 'copy control must not cover the start of RTL article source').toBeGreaterThanOrEqual(placement.sourceEnd);
  });

  test(`${prefix || '/'} copy controls stay clear of frame titles and within short source blocks`, async ({ page }) => {
    for (const width of [320, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${prefix}/code/`);
      for (const theme of ['light', 'dark']) {
        if (width < 800) await page.getByRole('button', { name: 'Menu', exact: true }).click();
        await page.locator('#color-mode').selectOption(theme);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        if (width < 800) await page.keyboard.press('Escape');
        const placements = await page.locator('#article .code-frame').evaluateAll((frames) =>
          frames.map((frame) => {
            const button = frame.querySelector('.copy-button').getBoundingClientRect();
            const pre = frame.querySelector('pre').getBoundingClientRect();
            const title = frame.querySelector('.code-title');
            const framedHeader = title || frame.dataset.codeFrame === 'terminal';
            const caption = title?.getBoundingClientRect();
            return {
              header: Boolean(framedHeader),
              top: button.top - pre.top,
              bottom: button.bottom - pre.top,
              sourceHeight: pre.height,
              titleEnd: caption ? caption.right - parseFloat(getComputedStyle(title).paddingRight) : null,
              buttonStart: button.left,
            };
          }),
        );
        for (const placement of placements) {
          if (placement.header) {
            expect(placement.bottom, 'copy control must not straddle title and source').toBeLessThanOrEqual(0);
            if (placement.titleEnd !== null) {
              expect(placement.titleEnd, 'caption must leave room for its copy control').toBeLessThanOrEqual(placement.buttonStart);
            }
          } else {
            expect(placement.top).toBeGreaterThanOrEqual(0);
            expect(placement.bottom).toBeLessThanOrEqual(placement.sourceHeight);
          }
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      }
    }
  });

  test(`${prefix || '/'} nested Markdown anchors retain engine targets without changing component titles`, async ({ page }) => {
    await page.goto(`${prefix}/`);
    const card = page.locator('#article article.card');
    const heading = card.getByRole('heading', { name: 'Nested component prose', exact: true });
    const id = await heading.getAttribute('id');
    expect(id).toBeTruthy();
    const anchor = card.getByRole('link', { name: 'Section titled “Nested component prose”', exact: true });
    await expect(anchor).toHaveAttribute('href', `#${encodeURIComponent(id)}`);
    await anchor.focus();
    await expect(anchor).toBeFocused();
    await anchor.press('Enter');
    expect(decodeURIComponent(new URL(page.url()).hash.slice(1))).toBe(id);
    await expect(heading).toBeInViewport();
    await expect(card.locator('[data-title]')).toHaveText('Literal <mark>title</mark> & safe');
    await expect(card.locator('[data-title] a')).toHaveCount(0);
  });

  test(`${prefix || '/'} narrow prose wraps while wide reading surfaces scroll locally`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    for (const [route, selector] of [
      ['/code/', 'figure:has(.code-title:text-is("wide.json")) pre'],
      ['/markdown/', 'table'],
      ['/tabs/', '[role="tablist"]'],
      ['/file-trees/', '.file-tree'],
      ['/internals/', 'p code'],
    ]) {
      await page.goto(`${prefix}${route}`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
      const targets = page.locator(`#article ${selector}`);
      expect(await targets.count()).toBeGreaterThan(0);
      for (const target of await targets.all()) {
        const geometry = await target.evaluate((node) => ({
          client: node.clientWidth, scroll: node.scrollWidth,
          overflow: getComputedStyle(node).overflowX,
          whiteSpace: getComputedStyle(node).whiteSpace,
        }));
        if (selector === 'p code') expect(geometry.whiteSpace).toBe('normal');
        else if (geometry.scroll > geometry.client + 1) {
          expect(['auto', 'scroll']).toContain(geometry.overflow);
          await target.evaluate((node) => { node.scrollLeft = 80; });
          expect(Math.abs(await target.evaluate((node) => node.scrollLeft))).toBeGreaterThan(0);
        }
      }
      if (route === '/code/') {
        const block = targets.first();
        await block.focus();
        await expect(block).toBeFocused();
        await page.keyboard.press('ArrowRight');
        expect(await block.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
      }
    }
    // The real Arabic guide has a wide table with literal URLs and commands.
    // Paper must wrap those cells, not preserve the screen-only nowrap seam.
    await page.goto(`/localized${prefix}/ar/dalil/`);
    await page.emulateMedia({ media: 'print' });
    const table = page.locator('#article table');
    const paper = await table.evaluate((node) => {
      const bounds = node.getBoundingClientRect();
      return {
        width: node.clientWidth, scroll: node.scrollWidth,
        literals: [...node.querySelectorAll('code')].flatMap((code) => [...code.getClientRects()].map((rect) => ({
          left: rect.left - bounds.left, right: rect.right - bounds.left,
        }))),
      };
    });
    expect(paper.scroll).toBeLessThanOrEqual(paper.width + 1);
    for (const literal of paper.literals) {
      expect(literal.left).toBeGreaterThanOrEqual(-1);
      expect(literal.right).toBeLessThanOrEqual(paper.width + 1);
    }
  });

  for (const theme of ['dark', 'punk', 'ice']) {
    test(`${prefix || '/'} ${theme} prints complete light content and restores exact screen state`, async ({ page }) => {
      await page.goto(`${prefix}/`);
      await page.locator('#color-mode').selectOption(theme);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      const state = () => page.evaluate(() => ({
        theme: document.documentElement.dataset.theme,
        scheme: document.documentElement.dataset.colorScheme,
        dark: document.documentElement.classList.contains('dark'),
        preference: localStorage.getItem('starlight-theme'),
        foreground: getComputedStyle(document.body).color,
        background: getComputedStyle(document.body).backgroundColor,
        storage: JSON.stringify(Object.entries(localStorage).sort()),
      }));
      const before = await state();
      const panels = page.locator('.tab-panel');
      await expect(panels.nth(1)).toBeHidden();
      const disclosure = page.locator('#article details').first();
      await disclosure.evaluate((node) => { node.open = false; });
      await page.emulateMedia({ media: 'print' });
      for (const panel of await panels.all()) await expect(panel).toBeVisible();
      for (const label of await page.locator('.tab-item-label').all()) await expect(label).toBeVisible();
      // WebKit's visibility heuristic treats every closed details descendant
      // as hidden even when ::details-content visibly paints it for print.
      const expanded = await disclosure.evaluate((node) => ({
        bottom: node.getBoundingClientRect().bottom,
        contentBottom: node.querySelector('ul').getBoundingClientRect().bottom,
        contentHeight: node.querySelector('ul').getBoundingClientRect().height,
        contentVisibility: getComputedStyle(node, '::details-content').contentVisibility,
        opacity: getComputedStyle(node, '::details-content').opacity,
      }));
      expect(expanded.contentHeight).toBeGreaterThan(0);
      expect(expanded.contentVisibility).toBe('visible');
      expect(expanded.opacity).toBe('1');
      expect(expanded.contentBottom).toBeLessThanOrEqual(expanded.bottom + 1);
      await expect(disclosure).toContainText('complete-output.txt');
      await expect(page.locator('#global-controls')).toBeHidden();
      await expect(page.locator('#site-nav')).toBeHidden();
      await expect(page.locator('.print-canonical')).toBeVisible();
      await expect(page.locator('.print-canonical')).toContainText(`http://127.0.0.1:4444${prefix}/`);
      const printed = await state();
      expect(printed.background).toBe('rgb(255, 255, 255)');
      expect(printed.foreground).toBe('rgb(23, 23, 23)');
      expect(printed.dark).toBe(true);
      expect(printed.storage).toBe(before.storage);
      const external = page.locator('#article a[href="https://example.test/print-target?mode=complete"]');
      expect(await external.evaluate((node) => getComputedStyle(node, '::after').content)).toContain('https://example.test/print-target?mode=complete');
      for (const name of ['Internal navigation', 'page fragment', 'email', 'telephone']) {
        expect(await page.getByRole('link', { name, exact: true }).evaluate((node) => getComputedStyle(node, '::after').content)).toBe('none');
      }
      await page.emulateMedia({ media: 'screen' });
      expect(await state()).toEqual(before);
      await expect(panels.nth(1)).toBeHidden();
      await expect(disclosure).not.toHaveAttribute('open', '');
    });
  }
}

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const fixtureRoot = new URL('./fixtures/minisearch/7.2.0/', import.meta.url);
export const miniSearchManifest = JSON.parse(readFileSync(new URL('manifest.json', fixtureRoot), 'utf8'));
export const miniSearchURL = miniSearchManifest.source;
const miniSearch = readFileSync(new URL('index.min.js', fixtureRoot));
const integrity = `sha384-${createHash('sha384').update(miniSearch).digest('base64')}`;
if (integrity !== miniSearchManifest.integrity ||
    createHash('sha256').update(miniSearch).digest('hex') !== miniSearchManifest.sha256 ||
    miniSearch.length !== miniSearchManifest.bytes) {
  throw new Error('Maintainer MiniSearch fixture failed integrity validation');
}
// Keep the test fixture tied to the production SRI without changing its loading path.
for (const name of ['default', 'splash', 'not-found']) {
  const layout = readFileSync(new URL(`../../_layouts/${name}.html`, import.meta.url), 'utf8');
  if (!layout.includes(`src="${miniSearchURL}" integrity="${integrity}"`)) {
    throw new Error(`MiniSearch fixture does not match ${name} layout SRI`);
  }
}

export async function installLocalRequestPolicy(context, { origins, requests = [] }) {
  const allowed = new Set(origins.map((origin) => new URL(origin).origin));
  await context.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    let action;
    if (!['http:', 'https:'].includes(url.protocol)) action = 'non-network';
    else if (url.href === miniSearchURL) action = 'local-minisearch';
    else if (allowed.has(url.origin)) action = 'local';
    else action = 'blocked-external';
    requests.push({ url: url.href, method: request.method(), action });
    if (action === 'local-minisearch') {
      await route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        headers: { 'access-control-allow-origin': '*' },
        body: miniSearch,
      });
    } else if (action === 'blocked-external') {
      await route.abort('blockedbyclient');
    } else {
      await route.continue();
    }
  });
  return requests;
}

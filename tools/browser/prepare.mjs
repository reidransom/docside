import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { arch, platform, release, tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import revisions from './browser-revisions.json' with { type: 'json' };
import { featurePages, installations, localizedInstallations, modes, pages, viewports } from './matrix.mjs';

const browserRoot = dirname(fileURLToPath(import.meta.url));
const repository = resolve(browserRoot, '../..');
const artifacts = join(browserRoot, '.artifacts');
const workspace = join(tmpdir(), 'docifly-browser-acceptance');
const source = join(workspace, 'consumer');
const output = join(workspace, 'site-output');
const theme = join(source, '_theme', 'docifly');
const jigyll = process.env.JIGYLL || 'jigyll';

rmSync(artifacts, { recursive: true, force: true });
rmSync(workspace, { recursive: true, force: true });
mkdirSync(artifacts, { recursive: true });
mkdirSync(source, { recursive: true });
cpSync(join(repository, 'fixtures', 'content'), source, { recursive: true });
// Reuse maintained author examples, not copies of their rendered implementation.
for (const name of readdirSync(join(repository, 'docs'))) {
  if (name.endsWith('.md') && name !== 'index.md') {
    cpSync(join(repository, 'docs', name), join(source, name));
  }
}
cpSync(join(repository, 'docs', 'media'), join(source, 'media'), { recursive: true });
for (const name of ['excluded.md', 'unpublished.md']) {
  mkdirSync(join(source, 'search-fixtures'), { recursive: true });
  cpSync(join(repository, 'fixtures', 'search', name), join(source, 'search-fixtures', name));
}
cpSync(repository, theme, {
  recursive: true,
  filter(path) {
    const name = relative(repository, path).split(sep).join('/');
    return !(
      name === '.git' || name.startsWith('.git/') ||
      name === '.scratch' || name.startsWith('.scratch/') ||
      name === '.poc' || name.startsWith('.poc/') ||
      name === '_site' || name.startsWith('_site/') ||
      name === 'tools/browser/node_modules' || name.startsWith('tools/browser/node_modules/') ||
      name === 'tools/browser/.artifacts' || name.startsWith('tools/browser/.artifacts/')
    );
  },
});

const config = (baseurl) => `title: Docifly Docs
url: http://127.0.0.1:4444
baseurl: "${baseurl}"
theme: docifly
permalink: pretty
navigation:
  - label: Overview
    link: /
  - label: Guides
    items:
      - label: Long guide
        link: /guides/long-guide/
  - label: Reference
    items:
      - label: Code examples
        link: /reference/code-examples/
      - label: Badges
        link: /badges/
        badge: {text: New!, variant: success, size: large}
      - label: Cards
        link: /cards/
        aria_label: Cards, stable
        badge: {text: Stable, variant: note, size: small}
docifly_versioning:
  entries:
    - id: legacy
      label: Legacy documentation release with an intentionally long label
      base_url: /legacy/
    - id: current
      label: Current documentation release
      base_url: ${baseurl || '/'}
  active_id: current
defaults:
  - scope: {path: ""}
    values: {layout: default}
`;

const run = (command, args, options = {}) =>
  execFileSync(command, args, { cwd: repository, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...options }).trim();

writeFileSync(join(source, '_config.yml'), config(''));
run(jigyll, ['build', '--source', source, '--destination', output]);
writeFileSync(join(source, '_config.yml'), config('/docs'));
run(jigyll, ['build', '--source', source, '--destination', join(output, 'docs')]);

// The existing native localization fixture is a companion consumer at both prefixes.
const localizedSource = join(workspace, 'localized-consumer');
cpSync(join(repository, 'fixtures', 'localization', 'site'), localizedSource, { recursive: true });
// The older retained catalogs predate these registered proper-name themes.
// Supplement the disposable consumer only; do not alter the source catalogs.
for (const locale of ['en', 'fr', 'ar']) {
  const catalog = join(localizedSource, '_data', 'locales', locale, 'messages.yml');
  writeFileSync(catalog, readFileSync(catalog, 'utf8')
    .replace('  color_mode:\n', '  color_mode:\n    punk: "Punk"\n    ice: "Ice"\n'));
}
mkdirSync(join(localizedSource, '_theme'), { recursive: true });
symlinkSync(theme, join(localizedSource, '_theme', 'docifly'), 'dir');
const localizedConfig = readFileSync(join(localizedSource, '_config.yml'), 'utf8');
for (const baseurl of ['/localized', '/localized/docs']) {
  writeFileSync(join(localizedSource, '_config.yml'), localizedConfig
    .replace('url: https://example.test', 'url: http://127.0.0.1:4444')
    .replace('baseurl: ""', `baseurl: "${baseurl}"`));
  run(jigyll, ['build', '--source', localizedSource, '--destination', join(output, baseurl)]);
}

const themeDiff = execFileSync(
  'git',
  [
    'diff',
    '--binary',
    'HEAD',
    '--',
    '_config.yml',
    '_data',
    '_includes',
    '_layouts',
    '_sass',
    'assets',
  ],
  { cwd: repository },
);
const packageLock = readFileSync(join(browserRoot, 'package-lock.json'));
const environment = {
  generatedAt: new Date().toISOString(),
  scope: 'Pinned Playwright browser binaries on Linux only; excludes Edge, real Safari, mobile devices, and accessibility certification.',
  playwright: revisions.playwright,
  browsers: revisions.browsers,
  platform: { platform: platform(), release: release(), arch: arch() },
  theme: {
    commit: run('git', ['rev-parse', 'HEAD']),
    workingTreeSha256: createHash('sha256').update(themeDiff).digest('hex'),
  },
  jigyll: run(jigyll, ['version']),
  packageLockSha256: createHash('sha256').update(packageLock).digest('hex'),
  installations,
  localizedInstallations,
  pages: [...pages, ...featurePages],
  modes,
  viewports,
};
writeFileSync(join(artifacts, 'environment.json'), `${JSON.stringify(environment, null, 2)}\n`);
console.log(`Built root and /docs consumers in ${output}`);

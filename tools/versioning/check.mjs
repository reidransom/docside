#!/usr/bin/env node
import { createServer } from 'node:http';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const build = resolve(dirname(fileURLToPath(import.meta.url)), 'build.mjs');
const temporary = resolve(tmpdir(), `docside-versioning-check-${process.pid}-${Date.now()}`);
const source = join(temporary, 'consumer');
const stage = join(temporary, 'stage');
const report = join(temporary, 'report.json');
const jigyll = process.env.JIGYLL ?? 'jigyll';
const command = (program, args, options = {}) => execFileSync(program, args, { encoding: 'utf8', stdio: 'pipe', ...options });
const require = (condition, message) => { if (!condition) throw new Error(message); };
const buildMatrix = (matrix, expected = 0) => {
  const matrixPath = join(temporary, 'matrix.json');
  writeFileSync(matrixPath, `${JSON.stringify(matrix, null, 2)}\n`);
  const result = spawnSync(process.execPath, [build, '--matrix', matrixPath, '--source', source, '--stage', stage, '--report', report, '--jigyll', jigyll], { encoding: 'utf8' });
  require(result.status === expected, `matrix exit ${result.status}: ${result.stderr}`);
  return result;
};
const commit = (name, label, only) => {
  rmSync(join(source, 'only.md'), { force: true });
  writeFileSync(join(source, 'index.md'), `---\ntitle: ${label}\npermalink: /\n---\n\n${label} documentation.\n`);
  writeFileSync(join(source, 'release.md'), `---\ntitle: ${label} guide\npermalink: /guide/\n---\n\n${label} guide corpus.\n`);
  writeFileSync(join(source, 'only.md'), `---\ntitle: ${only}\npermalink: /${only}/\n---\n\n${only} only.\n`);
  command('git', ['add', '.'], { cwd: source });
  command('git', ['commit', '-m', name], { cwd: source });
  return command('git', ['rev-parse', 'HEAD'], { cwd: source }).trim();
};

try {
  mkdirSync(join(source, '_theme'), { recursive: true });
  symlinkSync(root, join(source, '_theme', 'docside'), 'dir');
  writeFileSync(join(source, '_config.yml'), 'title: Matrix fixture\ntheme: docside\nnavigation:\n  - label: Home\n    link: /\ndefaults:\n  - scope: {path: ""}\n    values: {layout: default}\n');
  command('git', ['init'], { cwd: source });
  command('git', ['config', 'user.email', 'matrix@example.test'], { cwd: source });
  command('git', ['config', 'user.name', 'Matrix fixture'], { cwd: source });
  const first = commit('first release', 'First release', 'first-only');
  const second = commit('second release', 'Second release', 'second-only');
  const third = commit('third release', 'Third release', 'third-only');
  const matrix = { entries: [
    { id: 'v1', label: 'Version 1', ref: first, baseUrl: '/' },
    { id: 'v2', label: 'Version 2', ref: second, baseUrl: '/v2/' },
    { id: 'v3', label: 'Version 3', ref: third, baseUrl: '/v3/' },
  ] };
  buildMatrix(matrix);
  const firstPage = readFileSync(join(stage, 'index.html'), 'utf8');
  const secondPage = readFileSync(join(stage, 'v2/index.html'), 'utf8');
  const thirdPage = readFileSync(join(stage, 'v3/index.html'), 'utf8');
  require(firstPage.includes('First release documentation.'), 'first release was not staged at root');
  require(secondPage.includes('Second release documentation.'), 'second release was not staged at /v2/');
  require(thirdPage.includes('Third release documentation.'), 'third release was not staged at /v3/');
  require(firstPage.includes('href="/v2/"'), 'picker did not use the configured v2 homepage');
  require(secondPage.includes('aria-current="page">Version 2'), 'picker did not identify the active release');
  require(existsSync(join(stage, 'v3/third-only/index.html')), 'release-specific page was not staged');
  require(!existsSync(join(stage, 'v2/third-only/index.html')), 'release-specific page leaked into another release');
  const successful = JSON.parse(readFileSync(report, 'utf8'));
  require(successful.status === 'success' && successful.releases.length === 3, 'success report is incomplete');
  require(successful.releases.every((release) => release.commit && release.destination), 'report omitted release provenance');
  const server = createServer((request, response) => {
    const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
    const file = resolve(stage, `.${pathname.endsWith('/') ? `${pathname}index.html` : pathname}`);
    if (!file.startsWith(`${stage}/`)) {
      response.writeHead(400).end();
      return;
    }
    try {
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(readFileSync(file));
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  try {
    const origin = `http://127.0.0.1:${server.address().port}`;
    const servedFirst = await (await fetch(`${origin}/`)).text();
    const servedSecond = await (await fetch(`${origin}/v2/`)).text();
    require(servedFirst.includes('First release documentation.'), 'served root did not identify its release');
    require(servedSecond.includes('Second release documentation.'), 'configured version homepage did not serve its release');
  } finally {
    await new Promise((done) => server.close(done));
  }

  writeFileSync(join(stage, 'previous-stage.txt'), 'keep until a successful replacement\n');
  buildMatrix({ entries: [{ id: 'v1', label: 'Version 1', ref: first, baseUrl: '/' }, { id: 'v1', label: 'Duplicate', ref: second, baseUrl: '/v2/' }] }, 1);
  require(existsSync(join(stage, 'previous-stage.txt')), 'failed preflight replaced the previous stage');
  const invalid = JSON.parse(readFileSync(report, 'utf8'));
  require(invalid.failure.phase === 'preflight' && invalid.failure.entry === 'v1', 'invalid declaration report lacks entry context');

  for (const invalidMatrix of [
    { entries: [{ id: '', label: 'Version 1', ref: first, baseUrl: '/' }] },
    { entries: [{ id: 'v1', label: '', ref: first, baseUrl: '/' }] },
    { entries: [{ id: 'v1', label: 'Version 1', ref: first, baseUrl: 'https://example.test/' }] },
    { entries: [{ id: 'v1', label: 'Version 1', ref: first, baseUrl: '/v1/' }, { id: 'v2', label: 'Version 2', ref: second, baseUrl: '/v1/guides/' }] },
  ]) {
    buildMatrix(invalidMatrix, 1);
    require(JSON.parse(readFileSync(report, 'utf8')).failure.phase === 'preflight', 'invalid matrix did not fail in preflight');
    require(existsSync(join(stage, 'previous-stage.txt')), 'invalid declaration replaced the previous stage');
  }

  writeFileSync(join(source, '_config.yml'), 'title: Broken fixture\ntheme: missing-theme\n');
  command('git', ['add', '_config.yml'], { cwd: source });
  command('git', ['commit', '-m', 'broken release'], { cwd: source });
  const broken = command('git', ['rev-parse', 'HEAD'], { cwd: source }).trim();
  buildMatrix({ entries: [{ id: 'broken', label: 'Broken', ref: broken, baseUrl: '/broken/' }] }, 1);
  require(JSON.parse(readFileSync(report, 'utf8')).failure.phase === 'build', 'failed Jigyll build lacks phase');
  require(existsSync(join(stage, 'previous-stage.txt')), 'failed Jigyll build replaced the previous stage');

  writeFileSync(join(source, '_config.yml'), 'title: Matrix fixture\ntheme: docside\nnavigation:\n  - label: Home\n    link: /\ndefaults:\n  - scope: {path: ""}\n    values: {layout: default}\n');
  mkdirSync(join(source, 'v2'), { recursive: true });
  writeFileSync(join(source, 'v2/index.md'), '---\ntitle: Collision\npermalink: /v2/\n---\n\nCollision.\n');
  command('git', ['add', '.'], { cwd: source });
  command('git', ['commit', '-m', 'collision release'], { cwd: source });
  const collision = command('git', ['rev-parse', 'HEAD'], { cwd: source }).trim();
  buildMatrix({ entries: [{ id: 'root', label: 'Root', ref: collision, baseUrl: '/' }, { id: 'v2', label: 'Version 2', ref: second, baseUrl: '/v2/' }] }, 1);
  require(JSON.parse(readFileSync(report, 'utf8')).failure.phase === 'compose', 'composition collision lacks phase');
  require(existsSync(join(stage, 'previous-stage.txt')), 'composition collision replaced the previous stage');

  buildMatrix({ entries: [{ id: 'v1', label: 'Version 1', ref: 'does-not-exist', baseUrl: '/' }, { id: 'v2', label: 'Version 2', ref: second, baseUrl: '/v2/' }] }, 1);
  require(existsSync(join(stage, 'previous-stage.txt')), 'failed resolution replaced the previous stage');
  require(JSON.parse(readFileSync(report, 'utf8')).failure.phase === 'resolve', 'unresolved ref report lacks phase');

  const reduced = { entries: [{ id: 'v1', label: 'Version 1', ref: first, baseUrl: '/' }] };
  buildMatrix(reduced);
  require(!existsSync(join(stage, 'v3')), 'removed release survived a clean staged build');
  require(!readFileSync(join(stage, 'index.html'), 'utf8').includes('id="version-picker"'), 'single-release output rendered a version picker');
  console.log('version matrix checks passed');
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { tmpdir } from 'node:os';

class MatrixFailure extends Error {
  constructor(phase, message, entry) {
    super(message);
    this.phase = phase;
    this.entry = entry;
  }
}

const argumentsByName = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  const name = process.argv[index];
  const value = process.argv[index + 1];
  if (!name?.startsWith('--') || value === undefined) throw new MatrixFailure('arguments', `expected --name value, received ${name ?? 'nothing'}`);
  argumentsByName.set(name.slice(2), value);
}
const required = (name) => {
  const value = argumentsByName.get(name);
  if (!value) throw new MatrixFailure('arguments', `--${name} is required`);
  return resolve(value);
};
const matrixPath = required('matrix');
const source = required('source');
const stage = required('stage');
const jigyll = argumentsByName.get('jigyll') ?? 'jigyll';
const reportPath = resolve(argumentsByName.get('report') ?? join(dirname(stage), 'version-matrix-report.json'));

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options });
  if (result.error) throw result.error;
  return result;
};
const commandOutput = (command, args, options, phase, entry) => {
  const result = run(command, args, options);
  if (result.status !== 0) {
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
    throw new MatrixFailure(phase, output || `${command} exited ${result.status}`, entry);
  }
  return (result.stdout ?? '').trim();
};
const clean = (value) => (typeof value === 'string' ? value.trim() : '');
const basePath = (value, entry) => {
  if (typeof value !== 'string' || !/^\/(?:[A-Za-z0-9._~-]+\/)*$/.test(value)) {
    throw new MatrixFailure('preflight', `${entry}: baseUrl must be a normalized root-relative path ending in /`, entry);
  }
  return value;
};
let entries = [];
let preflightFailure;
try {
  const matrix = JSON.parse(readFileSync(matrixPath, 'utf8'));
  if (!Array.isArray(matrix.entries) || matrix.entries.length === 0) throw new MatrixFailure('preflight', 'matrix.entries must contain at least one entry');
  const seenIds = new Set();
  const seenBases = new Set();
  entries = matrix.entries.map((raw, index) => {
    const entry = `entry ${index + 1}`;
    const id = clean(raw?.id);
    const label = clean(raw?.label);
    const ref = clean(raw?.ref);
    if (!id) throw new MatrixFailure('preflight', `${entry}: id must not be empty`, entry);
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(id)) throw new MatrixFailure('preflight', `${entry} (${id}): id must be a safe path segment`, id);
    if (!label) throw new MatrixFailure('preflight', `${entry} (${id}): label must not be empty`, id);
    if (!ref) throw new MatrixFailure('preflight', `${entry} (${id}): ref must not be empty`, id);
    const baseUrl = basePath(raw?.baseUrl, id);
    if (seenIds.has(id)) throw new MatrixFailure('preflight', `${id}: duplicate id`, id);
    if (seenBases.has(baseUrl)) throw new MatrixFailure('preflight', `${id}: duplicate baseUrl ${baseUrl}`, id);
    seenIds.add(id);
    seenBases.add(baseUrl);
    return { id, label, ref, baseUrl };
  });
  for (const entry of entries) {
    for (const other of entries) {
      if (entry === other || entry.baseUrl === '/' || other.baseUrl === '/') continue;
      if (entry.baseUrl.startsWith(other.baseUrl) || other.baseUrl.startsWith(entry.baseUrl)) {
        throw new MatrixFailure('preflight', `${entry.id}: baseUrl ${entry.baseUrl} overlaps ${other.id} (${other.baseUrl})`, entry.id);
      }
    }
  }
} catch (error) {
  preflightFailure = error instanceof MatrixFailure ? error : new MatrixFailure('preflight', error.message);
}

const report = { status: 'failed', entries: entries.map(({ id, label, ref, baseUrl }) => ({ id, label, ref, baseUrl })), jigyll: null, releases: [] };
const writeReport = () => {
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
};
if (preflightFailure) {
  report.failure = { phase: preflightFailure.phase, entry: preflightFailure.entry ?? null, message: preflightFailure.message };
  writeReport();
  console.error(`version matrix ${preflightFailure.phase}${preflightFailure.entry ? ` (${preflightFailure.entry})` : ''}: ${preflightFailure.message}`);
  process.exit(1);
}
const walk = (root) => {
  const paths = [];
  const visit = (directory) => {
    for (const item of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, item.name);
      if (item.isDirectory()) visit(path);
      else if (item.isFile() || item.isSymbolicLink()) paths.push(path);
    }
  };
  visit(root);
  return paths;
};
const publicData = (activeId) => ({
  docside_versioning: {
    entries: entries.map(({ id, label, baseUrl }) => ({ id, label, base_url: baseUrl })),
    active_id: activeId,
  },
});

try {
  if (!existsSync(source)) throw new MatrixFailure('preflight', `source checkout does not exist: ${source}`);
  report.jigyll = commandOutput(jigyll, ['version'], { cwd: source }, 'preflight');
  const resolutions = entries.map((entry) => {
    const result = run('git', ['rev-parse', '--verify', `${entry.ref}^{commit}`], { cwd: source });
    return { entry, commit: result.status === 0 ? (result.stdout ?? '').trim() : null, error: `${result.stdout ?? ''}${result.stderr ?? ''}`.trim() };
  });
  const unresolved = resolutions.filter(({ commit }) => !commit);
  if (unresolved.length) {
    throw new MatrixFailure('resolve', unresolved.map(({ entry, error }) => `${entry.id} (${entry.ref}): ${error || 'not found'}`).join('\n'));
  }

  const workspace = resolve(tmpdir(), `docside-version-matrix-${process.pid}-${Date.now()}`);
  mkdirSync(workspace, { recursive: true });
  try {
    for (const { entry, commit } of resolutions) {
      const checkout = join(workspace, 'checkouts', entry.id);
      const output = join(workspace, 'builds', entry.id);
      try {
        commandOutput('git', ['clone', '--no-checkout', source, checkout], {}, 'checkout', entry.id);
        commandOutput('git', ['checkout', '--detach', commit], { cwd: checkout }, 'checkout', entry.id);
        const generatedConfig = join(checkout, '.docside-versioning.yml');
        writeFileSync(generatedConfig, `${JSON.stringify(publicData(entry.id), null, 2)}\n`);
        commandOutput(
          jigyll,
          ['build', '--source', checkout, '--destination', output, `--baseurl=${entry.baseUrl}`, `--config=${join(checkout, '_config.yml')},${generatedConfig}`],
          { cwd: checkout },
          'build',
          entry.id,
        );
        if (!existsSync(join(output, 'index.html'))) throw new MatrixFailure('build', `${entry.id}: build did not produce index.html`, entry.id);
        let theme = 'unavailable';
        const themeDirectory = join(checkout, '_theme', 'docside');
        if (existsSync(themeDirectory)) {
          const identity = run('git', ['rev-parse', 'HEAD'], { cwd: themeDirectory });
          if (identity.status === 0) theme = (identity.stdout ?? '').trim();
        }
        report.releases.push({ id: entry.id, label: entry.label, baseUrl: entry.baseUrl, commit, theme, destination: output });
      } catch (error) {
        if (error instanceof MatrixFailure) throw error;
        throw new MatrixFailure('checkout', `${entry.id}: ${error.message}`, entry.id);
      }
    }

    const composed = join(workspace, 'stage');
    mkdirSync(composed);
    const claimed = new Map();
    for (const release of report.releases) {
      const entry = entries.find(({ id }) => id === release.id);
      const destination = join(composed, entry.baseUrl.slice(1));
      for (const file of walk(release.destination)) {
        const target = join(destination, relative(release.destination, file));
        const existing = claimed.get(target);
        if (existing) throw new MatrixFailure('compose', `${entry.id}: ${target} collides with ${existing}`, entry.id);
        claimed.set(target, entry.id);
      }
      mkdirSync(destination, { recursive: true });
      cpSync(release.destination, destination, { recursive: true });
    }
    mkdirSync(dirname(stage), { recursive: true });
    const previousStage = `${stage}.previous-${process.pid}`;
    rmSync(previousStage, { recursive: true, force: true });
    if (existsSync(stage)) renameSync(stage, previousStage);
    try {
      renameSync(composed, stage);
    } catch (error) {
      if (existsSync(previousStage)) renameSync(previousStage, stage);
      throw error;
    }
    rmSync(previousStage, { recursive: true, force: true });
    report.status = 'success';
    writeReport();
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
} catch (error) {
  const failure = error instanceof MatrixFailure ? error : new MatrixFailure('unexpected', error.message);
  report.failure = { phase: failure.phase, entry: failure.entry ?? null, message: failure.message };
  writeReport();
  console.error(`version matrix ${failure.phase}${failure.entry ? ` (${failure.entry})` : ''}: ${failure.message}`);
  process.exitCode = 1;
}

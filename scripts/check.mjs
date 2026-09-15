#!/usr/bin/env node
/**
 * The publication check.
 *
 * It walks the working tree and the built output and reports what is wrong,
 * one line per failure. It runs BEFORE a push, never after: a check that ran
 * after the push would be reporting a leak that had already happened.
 *
 * There is no test framework here on purpose. The things worth asserting about
 * a generated static site are "does this page exist" and "does this string
 * appear nowhere", and a framework would add a dependency without making
 * either one clearer.
 *
 *     npm run build && node scripts/check.mjs
 *
 * Exit status is 1 when anything failed.
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const DIST = join(ROOT, 'dist');
const CONTENT = join(ROOT, 'src/content/requirements');

const EXPECTED_REQUIREMENTS = 110;
const EXPECTED_FAMILIES = 14;
const EXPECTED_OBJECTIVES = 320;

/**
 * Strings that must not reach a published file, in any form.
 *
 * `vault_sources` is the frontmatter field naming the private pages a
 * requirement was written from. The sync strips it. This is the assertion that
 * the strip actually worked, made against the published bytes rather than
 * against the code that was supposed to do it.
 */
const FORBIDDEN = ['vault_sources', 'cmmc-vault'];

const failures = [];
let checks = 0;

function fail(path, problem) {
  failures.push(`FAIL ${relative(ROOT, path)}: ${problem}`);
}

function check(condition, path, problem) {
  checks += 1;
  if (!condition) fail(path, problem);
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else out.push(path);
  }
  return out;
}

// ---------------------------------------------------------------------------

async function checkBuildPresent() {
  if (await exists(DIST)) return true;
  fail(DIST, 'no build to check. Run `npm run build` first.');
  return false;
}

/**
 * The leak check, and the reason this script exists.
 *
 * It reads the synced Markdown as well as the rendered HTML, because the
 * Markdown is published too: it is committed to this repository and anyone can
 * read it there. Checking only `dist/` would pass a tree that leaks in git.
 */
async function checkNoPrivateReferences() {
  const targets = [];
  if (await exists(CONTENT)) targets.push(...(await walk(CONTENT)));
  if (await exists(DIST)) targets.push(...(await walk(DIST)));

  for (const path of targets) {
    if (!/\.(md|html|json|js|css|txt|xml)$/.test(path)) continue;
    const text = await readFile(path, 'utf-8');
    for (const term of FORBIDDEN) {
      checks += 1;
      if (text.includes(term)) fail(path, `contains "${term}"`);
    }
  }
}

async function checkSyncedContent() {
  if (!(await exists(CONTENT))) {
    fail(CONTENT, 'the requirement corpus has not been synced into this repository');
    return [];
  }
  const files = (await readdir(CONTENT)).filter((name) => name.endsWith('.md'));
  check(
    files.length === EXPECTED_REQUIREMENTS,
    CONTENT,
    `holds ${files.length} requirement files, expected ${EXPECTED_REQUIREMENTS}`,
  );
  return files.map((name) => name.replace(/\.md$/, ''));
}

async function checkRequirementPages(ids) {
  for (const id of ids) {
    const page = join(DIST, 'requirements', id, 'index.html');
    if (!(await exists(page))) {
      fail(page, `no page was built for requirement ${id}`);
      continue;
    }
    const html = await readFile(page, 'utf-8');

    // Every requirement page must carry at least one public citation. A claim
    // about what an assessor accepted, with nothing behind it, is the thing
    // this site exists not to publish.
    check(
      /href="https?:\/\//.test(html),
      page,
      'carries no public source link',
    );
    check(html.includes(id), page, `does not name requirement ${id}`);
  }
}

async function checkFamilyPages() {
  const dir = join(DIST, 'families');
  if (!(await exists(dir))) {
    // Family pages arrive with their own ticket. Absence is not yet a failure.
    return;
  }
  const built = (await readdir(dir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  check(
    built.length === EXPECTED_FAMILIES,
    dir,
    `holds ${built.length} family pages, expected ${EXPECTED_FAMILIES}`,
  );
}

async function checkObjectivePages() {
  const dir = join(DIST, 'objectives');
  if (!(await exists(dir))) return;
  const built = (await readdir(dir, { withFileTypes: true })).filter((entry) =>
    entry.isDirectory(),
  );
  check(
    built.length === EXPECTED_OBJECTIVES,
    dir,
    `holds ${built.length} objective pages, expected ${EXPECTED_OBJECTIVES}`,
  );
}

async function checkHomepage() {
  const page = join(DIST, 'index.html');
  check(await exists(page), page, 'no homepage was built');
}

// ---------------------------------------------------------------------------

async function main() {
  if (!(await checkBuildPresent())) {
    console.log(failures.join('\n'));
    console.log('check: 1 failing, nothing else ran');
    return 1;
  }

  const ids = await checkSyncedContent();
  await checkNoPrivateReferences();
  await checkHomepage();
  await checkRequirementPages(ids);
  await checkFamilyPages();
  await checkObjectivePages();

  for (const line of failures) console.log(line);
  console.log(
    `check: ${checks} assertions, ${failures.length} failing, ` +
      `${ids.length} requirements published`,
  );
  return failures.length ? 1 : 0;
}

process.exit(await main());

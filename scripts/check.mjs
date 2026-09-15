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

const GLOSSARY = join(ROOT, 'src/content/glossary.json');

const EXPECTED_REQUIREMENTS = 110;
const EXPECTED_FAMILIES = 14;
const EXPECTED_OBJECTIVES = 320;
const EXPECTED_TERMS = 27;

/**
 * Terms that describe how this project is built rather than what a CMMC term
 * means. The sync withholds them by name and trims them out of the definitions
 * it does publish. This is the assertion that both of those worked, made
 * against the published bytes rather than against the code meant to do it.
 */
const WITHHELD_TERMS = [
  'Fixture',
  'Cold run',
  'Seat',
  'Operator',
  'Engagement repo',
  'Control file',
  'Low confidence',
  'Vault',
  'Definition and enforcement pattern',
  'Open items list',
];

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

/** Undo the HTML escaping that stands between a rendered term and its source. */
function decode(html) {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
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

async function checkGlossary() {
  if (!(await exists(GLOSSARY))) {
    // The glossary arrives with its own ticket. Absence is not yet a failure.
    return;
  }
  const terms = JSON.parse(await readFile(GLOSSARY, 'utf-8'));
  check(
    terms.length === EXPECTED_TERMS,
    GLOSSARY,
    `publishes ${terms.length} terms, expected ${EXPECTED_TERMS}`,
  );

  const published = new Set(terms.map((entry) => entry.term));
  for (const required of ['Requirement', 'Objective', 'CUI', 'POA&M', 'OPA', 'C3PAO']) {
    check(published.has(required), GLOSSARY, `does not publish the term "${required}"`);
  }

  // A withheld term must be absent as a term AND absent from every definition,
  // because the leak that actually happened was inside a definition body.
  const body = terms
    .map((entry) => `${entry.term} ${entry.definition} ${entry.avoid}`)
    .join(' ')
    .toLowerCase();
  for (const withheld of WITHHELD_TERMS) {
    check(!body.includes(withheld.toLowerCase()), GLOSSARY, `publishes the withheld term "${withheld}"`);
  }

  // The words not to use are the reason this page is worth publishing.
  check(
    terms.some((entry) => entry.avoid),
    GLOSSARY,
    'carries no "avoid" guidance on any term',
  );

  const page = join(DIST, 'glossary', 'index.html');
  if (await exists(page)) {
    // Compare against decoded text. "POA&M" is correctly written "POA&amp;M"
    // in the HTML, and a raw substring check would call that a missing term.
    const html = decode(await readFile(page, 'utf-8'));
    for (const entry of terms) {
      check(html.includes(entry.term), page, `does not render the term "${entry.term}"`);
    }
  }
}

async function checkSearchIndex() {
  const index = join(DIST, 'pagefind', 'pagefind.js');
  if (!(await exists(index))) return;
  const fragments = join(DIST, 'pagefind', 'fragment');
  check(await exists(fragments), fragments, 'the search index holds no page fragments');
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
  await checkGlossary();
  await checkSearchIndex();

  for (const line of failures) console.log(line);
  console.log(
    `check: ${checks} assertions, ${failures.length} failing, ` +
      `${ids.length} requirements published`,
  );
  return failures.length ? 1 : 0;
}

process.exit(await main());

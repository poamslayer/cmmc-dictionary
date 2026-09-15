/**
 * The one parser.
 *
 * Every requirement file arrives with the same eight H2 sections, and this
 * module is the only place that fact is relied on. The sync that writes
 * `src/content/requirements/` does not parse, so there is one parser to keep
 * correct rather than two that can disagree.
 *
 * Three behaviours here are load-bearing and easy to break by accident:
 *
 *   - Objective letters are trailing markers on a claim, as in
 *     `... accepted in practice. [a][c]`. They are lifted off into a list and
 *     removed from the display text. That lifting is the only reason a page
 *     per objective is possible.
 *
 *   - The low confidence sentinel parses to an EMPTY ARRAY, never to a claim
 *     containing that sentence. A section with nothing in it and a section
 *     that was never sourced have to be tellable apart, because the page
 *     renders them differently on purpose.
 *
 *   - `points` is a string. 3.5.3 and 3.13.11 are the two adjustable
 *     requirements and carry "3 or 5". Anything that sorts or compares
 *     numerically on that field breaks on exactly two of the 110.
 */

export interface Claim {
  /** Display text, with the objective markers removed. Safe HTML. */
  text: string;
  /** The objective letters this claim bears on. May be empty. */
  objectives: string[];
}

export interface Objective {
  letter: string;
  text: string;
}

export type SectionName =
  | 'Sufficient'
  | 'Insufficient'
  | 'Over-engineering'
  | 'Edge cases'
  | 'Evidence examples';

export const SECTION_NAMES: SectionName[] = [
  'Sufficient',
  'Insufficient',
  'Over-engineering',
  'Edge cases',
  'Evidence examples',
];

/**
 * Fourteen of the 110 requirements carry this in four of their five sections.
 * It is content, not absence, and it parses to an empty array so the page can
 * render the designed empty state.
 */
const SENTINEL = 'No documented position';

/** Escape HTML, then restore the only two marks the files actually use. */
function inline(raw: string): string {
  const escaped = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped
    .replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([\s\S]+?)`/g, '<code>$1</code>');
}

/** Split a section into claims, lifting each one's objective letters off the end. */
function bullets(body: string): Claim[] {
  const claims: Claim[] = [];
  for (const chunk of body.trim().split(/\n(?=- )/)) {
    const raw = chunk.trim();
    if (!raw.startsWith('- ')) continue;
    const joined = raw.slice(2).replace(/\s*\n\s*/g, ' ').trim();
    const objectives = [...new Set([...joined.matchAll(/\[([a-z])\]/g)].map((m) => m[1]))].sort();
    const text = joined.replace(/(\s*\[[a-z]\])+\s*$/, '').trim();
    claims.push({ text: inline(text), objectives });
  }
  return claims;
}

/**
 * Read one H2 section's body. Returns undefined when the heading is absent,
 * which is different from a section that is present and empty, and the schema
 * rejects the first while accepting the second.
 */
function section(body: string, name: string): string | undefined {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = body.match(new RegExp(`## ${escaped}\\n([\\s\\S]*?)(?=\\n## |$)`));
  return match ? match[1].trim() : undefined;
}

function scalar(frontmatter: string, key: string): string | undefined {
  const match = frontmatter.match(new RegExp(`^${key}:[ \\t]*(.+)$`, 'm'));
  return match ? match[1].trim().replace(/^"(.*)"$/, '$1') : undefined;
}

function list(frontmatter: string, key: string): string[] {
  const match = frontmatter.match(new RegExp(`^${key}:[ \\t]*\\n([\\s\\S]*?)(?=^\\S|$)`, 'm'));
  if (!match) return [];
  return [...match[1].matchAll(/^\s*-\s*(.+)$/gm)].map((m) =>
    m[1].trim().replace(/^"(.*)"$/, '$1'),
  );
}

/**
 * Parse one requirement file into the shape the site renders.
 *
 * Deliberately permissive: anything missing comes back as undefined or an
 * empty value rather than throwing, so the schema reports the problem with the
 * file's name attached instead of a stack trace from here.
 */
export function parseRequirement(text: string): Record<string, unknown> {
  const parts = text.split(/^---$/m);
  const frontmatter = parts[1] ?? '';
  const body = parts.slice(2).join('---');

  const objectiveBlock = section(body, 'Objectives') ?? '';
  const objectives: Objective[] = [...objectiveBlock.matchAll(/\[([a-z])\]\s*([^[]+)/g)].map(
    (m) => ({
      letter: m[1],
      text: m[2].replace(/\s+/g, ' ').trim().replace(/[;.]$/, ''),
    }),
  );

  const sections: Partial<Record<SectionName, Claim[]>> = {};
  for (const name of SECTION_NAMES) {
    const raw = section(body, name);
    if (raw === undefined) continue;
    sections[name] = raw.includes(SENTINEL) ? [] : bullets(raw);
  }

  const relatedBlock = section(body, 'Related requirements') ?? '';
  const related = [
    ...new Set([...relatedBlock.matchAll(/\*\*(3\.\d+\.\d+)\*\*/g)].map((m) => m[1])),
  ];

  return {
    id: scalar(frontmatter, 'requirement'),
    family: scalar(frontmatter, 'family'),
    title: scalar(frontmatter, 'title'),
    points: scalar(frontmatter, 'points'),
    poam_eligible: scalar(frontmatter, 'poam_eligible') === 'true',
    confidence: scalar(frontmatter, 'confidence'),
    as_of: scalar(frontmatter, 'as_of'),
    public_sources: list(frontmatter, 'public_sources'),
    requirement: section(body, 'Requirement')?.replace(/^"(.*)"$/s, '$1'),
    objectives,
    sections,
    related,
  };
}

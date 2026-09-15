import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import type { Loader } from 'astro/loaders';
import { file } from 'astro/loaders';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseRequirement, SECTION_NAMES } from './lib/parse-requirement';

/**
 * The typed schema is the gate. A malformed requirement file fails the build
 * here, with the file's id in the error, rather than rendering as a silently
 * empty section that nobody notices until a reader asks why 3.4.2 has no
 * evidence examples.
 */
const claim = z.object({
  text: z.string().min(1),
  objectives: z.array(z.string().regex(/^[a-z]$/)),
});

const sections = z.object(
  Object.fromEntries(SECTION_NAMES.map((name) => [name, z.array(claim)])) as Record<
    (typeof SECTION_NAMES)[number],
    z.ZodArray<typeof claim>
  >,
);

export const requirementSchema = z.object({
  id: z.string().regex(/^3\.\d+\.\d+$/),
  family: z.enum(['AC', 'AT', 'AU', 'CA', 'CM', 'IA', 'IR', 'MA', 'MP', 'PE', 'PS', 'RA', 'SC', 'SI']),
  title: z.string().min(1),
  // A string, never a number. 3.5.3 and 3.13.11 are the adjustable ones.
  points: z.enum(['1', '3', '5', '3 or 5']),
  poam_eligible: z.boolean(),
  confidence: z.enum(['high', 'medium', 'low']),
  as_of: z.string().min(1),
  public_sources: z.array(z.string().min(1)).min(1),
  requirement: z.string().min(1),
  objectives: z.array(z.object({ letter: z.string().regex(/^[a-z]$/), text: z.string().min(1) })).min(1),
  sections,
  related: z.array(z.string().regex(/^3\.\d+\.\d+$/)),
});

export type Requirement = z.infer<typeof requirementSchema>;

/**
 * Read the generated Markdown and hand each file to the one parser.
 *
 * `src/content/requirements/` is written by the sync upstream and regenerated
 * in full on every run, so nothing here should ever be hand-edited.
 */
function requirementsLoader(dir: string): Loader {
  return {
    name: 'requirements-loader',
    load: async ({ store, parseData, logger }) => {
      store.clear();
      const files = (await readdir(dir)).filter((name) => name.endsWith('.md'));
      for (const file of files.sort()) {
        const id = file.replace(/\.md$/, '');
        const text = await readFile(join(dir, file), 'utf-8');
        const data = await parseData({ id, data: parseRequirement(text) });
        store.set({ id, data });
      }
      logger.info(`loaded ${files.length} requirements`);
    },
  };
}

/**
 * The glossary is generated too, from the same sync.
 *
 * `avoid` is the field worth having. It carries the words to stop using, which
 * is the part of a CMMC glossary nobody else publishes.
 */
export const glossarySchema = z.object({
  id: z.string().min(1),
  term: z.string().min(1),
  definition: z.string().min(1),
  avoid: z.string(),
});

export type GlossaryTerm = z.infer<typeof glossarySchema>;

const glossary = defineCollection({
  loader: file('./src/content/glossary.json'),
  schema: glossarySchema,
});

const requirements = defineCollection({
  loader: requirementsLoader('./src/content/requirements'),
  schema: requirementSchema,
});

export const collections = { requirements, glossary };

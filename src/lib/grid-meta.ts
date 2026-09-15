/*
  PLACEHOLDER DATA
  This module stands in for the content collection until the data layer lands.
  It exposes exactly one named export, `gridMeta`, so the grid and the family
  pages can swap the import for the real collection query without touching
  anything else. The JSON beside it carries the metadata for all 110
  requirements: id, family, title, points, POA&M eligibility, confidence, and
  the number of assessment objectives. It carries no corpus content.
*/

import type { Requirement } from './sample-requirements';
import raw from './grid-meta.json';

export type GridEntry = Pick<
  Requirement,
  'id' | 'family' | 'title' | 'points' | 'poam_eligible' | 'confidence'
> & {
  objectives: number; // a count, not the list
};

export const gridMeta: GridEntry[] = raw as GridEntry[];

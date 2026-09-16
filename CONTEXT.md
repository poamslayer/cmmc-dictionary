# CMMC Dictionary

The published reference at dictionary.poamslayer.com. It records what CMMC Level 2
assessors accepted, rejected, and considered wasted effort, tagged to the individual
assessment objective each position bears on.

This file is the project's own vocabulary, for the people and agents building the site.
It is not the published glossary. See **The glossary** below.

## Language

**Requirement**:
One of the 110 units of NIST SP 800-171 Rev 2, identified as `3.1.1`.
_Avoid_: Control, practice

**Objective**:
One of the 320 assessment objectives a requirement decomposes into, identified as
`3.1.1[a]`. The unit an assessor actually judges.
_Avoid_: Sub-control, criterion

**Family**:
One of the 14 groupings a requirement belongs to, keyed `AC`, `AT`, `AU` and so on.
_Avoid_: Domain, category

**Claim**:
One tagged bullet inside a section, carrying prose and the objective letters it bears
on. The corpus holds 1,731 of them.
_Avoid_: Item, entry, finding

**Section**:
One of the five named buckets a requirement's claims sit in: Sufficient, Insufficient,
Over-engineering, Edge cases, Evidence examples.

**Valence**:
Whether a section takes a position for or against the thing it describes. Only
Sufficient and Insufficient carry valence. Over-engineering and Edge cases are
observations, not verdicts, and Evidence examples is a list. Valence is the only
distinction on the site that earns a hue.

**Tone**:
The visual treatment that distinguishes one section from another. Historically one of
four hues; after the paper and ink change it means hue only for the two sections that
carry valence, and rule weight and ink density for the rest.
_Avoid_: Color, hue (a tone may be neither)

**Paper and ink**:
The two-color ground the site is built on. Everything structural resolves to one or the
other. A third color appearing anywhere is a bug unless it is carrying valence.

**The glossary**:
The 27 published CMMC terms in `src/content/glossary.json`, generated upstream, written
for readers, and carrying the `avoid` field that names the words to stop using. Distinct
from this file, which is written by hand for us and is never published.
_Avoid_: Calling this file a glossary, or merging the two

**The grid**:
The homepage projection of the 110: one cell per requirement in 14 family rows, encoding
confidence, points, or POA&M eligibility by ink density and border style. The reference
implementation of the site's visual encoding vocabulary.

**The map**:
The projection of the 110 at `/map`: a force layout over the `related` edges, clustered
by family. The grid's sibling, answering which requirements pull on each other rather
than how many there are.
_Avoid_: Graph (reads as "chart" to a compliance audience), network, diagram

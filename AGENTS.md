# cmmc-dictionary

The Astro site behind dictionary.poamslayer.com. Read `README.md` first.

## Layout

- `src/content/requirements/` is **generated**. It is written by a sync from the
  corpus upstream and regenerated in full on every run, so an edit made here is lost.
  Never hand-edit a file in this directory, and never fix a content error here.
- `src/styles/tokens.css` holds every design token and every shared primitive. Page
  styles that more than one page needs belong here, not in a page.
- `src/layouts/Base.astro` owns the document head, the masthead and the footer.
- `src/pages/` holds the routes. `src/components/` holds the Svelte islands.
- `scripts/check.mjs` is the publication check. `scripts/deploy-wizard.sh` walks a
  human through the Cloudflare and DNS setup.

## Rules for editing

- **No em dashes anywhere in prose.** Rewrite the sentence.
- Never write "control" to mean one of the 110. The two units are **requirement**
  (`3.1.1`) and **objective** (`3.1.1[a]`). "Control" belongs to NIST 800-53.
- `points` is a string, never a number. `3.5.3` and `3.13.11` carry `"3 or 5"`, so
  anything that sorts numerically on that field breaks.
- A requirement whose source was thin renders a designed empty state. The parser turns
  the low confidence sentinel into an empty array precisely so a section with nothing
  in it can be told apart from a section that was never sourced. Do not collapse the
  two.
- Run `npm run build` and `node scripts/check.mjs` before pushing. The check runs
  against the working tree before the push, never after: a check that ran after the
  push would report a leak that had already happened.

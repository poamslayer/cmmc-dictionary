# CMMC Dictionary

The site behind [dictionary.poamslayer.com](https://dictionary.poamslayer.com).

A public reference for the 110 security requirements in NIST SP 800-171 Rev 2 and
the 320 assessment objectives in NIST SP 800-171A, written for the person who has
just been handed a DFARS clause and needs to know where the bar actually is.

Most published guidance restates what a requirement says. You can already read
that. For each requirement this site records five things that are harder to find:
what assessors have accepted as sufficient, what they have rejected, what is
over-engineering, which edge cases are still open, and which evidence artifacts
have passed. Every claim carries the assessment objective letters it bears on, so
there is also a page for each of the 320 objectives answering the narrower
question: what satisfies `3.1.1[c]`.

Where the source material was thin, the requirement is marked low confidence and
its sections stay empty rather than padded. Fourteen of the 110 are marked that
way, and the homepage shows it.

## The content here is generated

`src/content/` is written by a sync from the corpus that maintains this material.
The sync regenerates rather than merges, so **an edit made in this repository is
lost on the next run.** That is deliberate, not a limitation to work around.

Everything else, the layout, the styles, the pages and the checks, is authored
here and edited here normally.

Found something wrong in the content? Open an issue. The fix is made upstream and
arrives on the next sync.

## Build

Node 22.12 or newer, pinned in `.nvmrc`.

```bash
npm install
npm run dev      # local development
npm run build    # production build into dist/
npm run preview  # serve the built site
node scripts/check.mjs   # the publication check
```

`scripts/check.mjs` walks the working tree and the built output and prints one
line per failure. It is the gate that runs before anything is pushed, never after.

## Deploy

Cloudflare Pages builds this repository on every push to `main` and serves it at
`dictionary.poamslayer.com`.

Setting that up touches a dashboard, so it is a script a human runs rather than a
procedure anyone has to remember:

```bash
bash scripts/deploy-wizard.sh
```

It walks the Cloudflare account, the Pages project, the build settings, the first
deployment, the custom domain, and a check from outside Cloudflare that the site
actually resolves. Re-running it is safe.

## License

See [LICENSE](LICENSE).

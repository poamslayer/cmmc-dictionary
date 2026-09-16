# Commit the solved map layout instead of solving it per build

The map lays out the 110 requirements with a force simulation over their `related`
edges. A force simulation seeded randomly settles somewhere different on every run, so
solving at build time would reshuffle the map on every deploy and it would never become
a place a reader could learn their way around. We solve it once, commit the coordinates
as a data file, and have the build read that file.

## Consequences

- The solve is a deliberate act, run by hand when the corpus gains or loses a
  requirement, not a step in `npm run build`.
- A node that lands badly can be nudged by editing the committed file, which a
  per-build solve would silently overwrite.
- The coordinate file is hand-editable and therefore must not live in
  `src/content/requirements/`, which the upstream sync regenerates in full.
- `d3-force` stays a devDependency and ships no bytes to the reader.
- The build needs to fail loudly when the corpus and the coordinate file disagree,
  because the failure mode otherwise is a requirement silently missing from the map.

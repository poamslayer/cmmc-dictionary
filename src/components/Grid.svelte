<script lang="ts">
  // The homepage grid: 14 family rows, one cell per requirement, and one
  // control that switches between three readings of the same cells.
  // Every cell is a link to its requirement page and carries an accessible
  // label naming the requirement, its title, and its value in the current
  // reading. Meaning is carried by ink density and border, never by hue.
  import { gridMeta, type GridEntry } from '../lib/grid-meta';
  import { families } from '../lib/families';

  type Mode = 'conf' | 'pts' | 'poam';
  type Fill = '' | 'mid' | 'hollow' | 'outline' | 'split';

  const MODES: { id: Mode; label: string; legendHeading: string }[] = [
    { id: 'conf', label: 'Confidence', legendHeading: 'Reading: confidence' },
    { id: 'pts', label: 'SPRS points', legendHeading: 'Reading: SPRS points' },
    { id: 'poam', label: 'POA&M', legendHeading: 'Reading: POA&M eligibility' },
  ];

  const LEGENDS: Record<Mode, { fill: Fill; label: string }[]> = {
    conf: [
      { fill: '', label: 'High confidence' },
      { fill: 'mid', label: 'Medium' },
      { fill: 'hollow', label: 'Low, source was thin' },
    ],
    pts: [
      { fill: '', label: '5 points' },
      { fill: 'mid', label: '3 points' },
      { fill: 'outline', label: '1 point' },
      { fill: 'split', label: '3 or 5, depends on how it is implemented' },
    ],
    poam: [
      { fill: '', label: 'Never POA&M-eligible' },
      { fill: 'outline', label: 'POA&M-eligible' },
    ],
  };

  // `points` is a string and is only ever compared as one. "3 or 5" is its
  // own case, never bucketed with "3" or with "5".
  function fill(e: GridEntry, mode: Mode): Fill {
    if (mode === 'conf') return e.confidence === 'low' ? 'hollow' : e.confidence === 'medium' ? 'mid' : '';
    if (mode === 'pts') {
      if (e.points === '3 or 5') return 'split';
      if (e.points === '1') return 'outline';
      if (e.points === '3') return 'mid';
      return '';
    }
    return e.poam_eligible ? 'outline' : '';
  }

  function value(e: GridEntry, mode: Mode): string {
    if (mode === 'conf') return `${e.confidence} confidence`;
    if (mode === 'pts') {
      if (e.points === '3 or 5') return '3 or 5 points, adjustable';
      return `${e.points} point${e.points === '1' ? '' : 's'}`;
    }
    return e.poam_eligible ? 'POA&M-eligible' : 'never POA&M-eligible';
  }

  const rows = families.map((f) => ({
    ...f,
    entries: gridMeta.filter((e) => e.family === f.code),
  }));

  let mode: Mode = $state('conf');
  const legend = $derived(LEGENDS[mode]);
  const heading = $derived(MODES.find((m) => m.id === mode)!.legendHeading);
</script>

<div class="bar">
  <div>
    <span class="seg-label" id="grid-reading">Read the grid by</span>
    <div class="seg" role="group" aria-labelledby="grid-reading">
      {#each MODES as m (m.id)}
        <button type="button" aria-pressed={mode === m.id} onclick={() => (mode = m.id)}>
          {m.label}
        </button>
      {/each}
    </div>
  </div>
  <ul class="legend" aria-label={heading} aria-live="polite">
    {#each legend as k (k.label)}
      <li><i class={["key", k.fill]} aria-hidden="true"></i>{k.label}</li>
    {/each}
  </ul>
</div>
<p class="grid-note">Every cell drops the leading 3. of its number, so cell 5.3 is requirement 3.5.3.</p>

<div class="grid-panel">
  {#each rows as fam (fam.code)}
    <div class="fam">
      <a class="fam-k" href="/families/{fam.code.toLowerCase()}/" aria-label="{fam.name} family, {fam.number}">
        {fam.code}
      </a>
      <ul class="cells" aria-label="{fam.name} requirements">
        {#each fam.entries as e (e.id)}
          <li>
            <a
              class={["cell", fill(e, mode)]}
              href="/requirements/{e.id}/"
              aria-label="{e.id} {e.title}, {value(e, mode)}"
              title="{e.id} {e.title}, {value(e, mode)}"
            >
              {e.id.replace(/^3\./, '')}
            </a>
          </li>
        {/each}
      </ul>
    </div>
  {/each}
</div>

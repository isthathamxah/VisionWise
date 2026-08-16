// One entry per distinct object class, highest-confidence instance first.
// Scanning a second "apple" against the same photo would just reproduce a
// near-duplicate result, so duplicate classes collapse to their best match.
export function dedupeDetections(predictions) {
  const sorted = [...predictions].sort((a, b) => b.score - a.score)
  const out = []
  for (const p of sorted) {
    if (!out.some(d => d.class === p.class)) out.push(p)
  }
  return out
}

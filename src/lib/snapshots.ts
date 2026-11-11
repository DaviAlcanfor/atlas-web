/** Closest snapshot year to `year`. A tie goes to the earlier snapshot. Returns null if there are no snapshots. */
export function nearestYear(years: readonly number[], year: number): { year: number; distance: number } | null {
  let best: { year: number; distance: number } | null = null;
  for (const y of years) {
    const distance = Math.abs(y - year);
    if (!best || distance < best.distance || (distance === best.distance && y < best.year)) best = { year: y, distance };
  }
  return best;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "2 min ago" / "3 hr ago" / "5 days ago" — matches how the mockup reads. */
export function formatRelativeTime(isoDate: string): string {
  const elapsed = Date.now() - new Date(isoDate).getTime();

  if (elapsed < HOUR) {
    return `${Math.max(1, Math.floor(elapsed / MINUTE))} min ago`;
  }
  if (elapsed < DAY) {
    return `${Math.floor(elapsed / HOUR)} hr ago`;
  }
  const days = Math.floor(elapsed / DAY);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

import type { CollectionEntry } from 'astro:content';

type Event = CollectionEntry<'events'>;

/**
 * An event counts as "past" only once its calendar day is over, so an event
 * happening later today still reads as upcoming for the whole day.
 *
 * The split is evaluated at build time (`new Date()`) — there is no manual
 * `isPast` flag any more, so rebuild/redeploy to refresh it. (For a club that
 * publishes on a schedule, a nightly rebuild keeps the calendar current.)
 */
export function isEventPast(event: Event, now: Date = new Date()): boolean {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  return event.data.date.valueOf() < startOfToday.valueOf();
}

/**
 * Split events into `upcoming` (soonest first) and `past` (most recent first).
 * Shared by the /evenements calendar and the homepage agenda so the two never
 * disagree about what's coming up.
 */
export function partitionEvents(events: Event[], now: Date = new Date()) {
  const upcoming = events
    .filter((e) => !isEventPast(e, now))
    .sort((a, b) => a.data.date.valueOf() - b.data.date.valueOf());
  const past = events
    .filter((e) => isEventPast(e, now))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  return { upcoming, past };
}

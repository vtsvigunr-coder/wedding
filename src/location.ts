/**
 * The Location section's two actions. Both are driven by data the markup
 * already shows the visitor, so the address and the date live in exactly one
 * place per action and the buttons can never drift from the printed details.
 */

export interface CalendarEvent {
  title: string;
  /** Local wall-clock times, `YYYY-MM-DDTHH:MM`. */
  start: string;
  end: string;
  location: string;
  description?: string;
}

/**
 * A Google Maps search link. `api=1` is the documented, version-stable entry
 * point: on a phone with the app installed it hands off to it, and everywhere
 * else it opens the web map with the same query already typed in.
 */
export function mapsUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** `2026-09-26T16:00` → `20260926T160000`, the form iCalendar wants. */
export function icsDateTime(local: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(local.trim());
  if (!match) throw new Error(`Not a local date-time: ${local}`);
  const [, year, month, day, hour, minute, second = '00'] = match;
  return `${year}${month}${day}T${hour}${minute}${second}`;
}

/** RFC 5545 escapes the value separators, so text has to be quoted first. */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * A one-event calendar file. The times are deliberately written without a zone
 * or a trailing `Z`: iCalendar reads those as floating local time, which is
 * what a wedding invitation means — 4 PM where the wedding is, whatever the
 * phone reading it happens to be set to.
 */
export function buildIcs(event: CalendarEvent, now = new Date()): string {
  const stamp = `${now.toISOString().slice(0, 19).replace(/[-:]/g, '')}Z`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Wedding Invitation//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${icsDateTime(event.start)}-wedding@invitation`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${icsDateTime(event.start)}`,
    `DTEND:${icsDateTime(event.end)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `LOCATION:${escapeIcsText(event.location)}`,
    ...(event.description ? [`DESCRIPTION:${escapeIcsText(event.description)}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  // CRLF, per the spec — some calendar clients reject a file joined with \n.
  return `${lines.join('\r\n')}\r\n`;
}

/** The venue as one line, the way it should be typed into a map search. */
function readAddress(root: HTMLElement): string {
  return Array.from(root.querySelectorAll('p'))
    .map((line) => line.textContent?.trim() ?? '')
    .filter(Boolean)
    .join(', ');
}

function readEvent(button: HTMLElement, location: string): CalendarEvent | null {
  const { start, end, title } = button.dataset;
  if (!start || !end || !title) return null;
  return { title, start, end, location };
}

/** Hands the file to the phone, which is what opens its calendar app. */
function downloadIcs(contents: string): void {
  const url = URL.createObjectURL(new Blob([contents], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'wedding.ics';
  link.click();
  // Revoked on the next frame rather than immediately: Safari has not finished
  // reading the blob by the time `click` returns.
  requestAnimationFrame(() => URL.revokeObjectURL(url));
}

export function initLocation(): void {
  const address = document.getElementById('location-address');
  const directions = document.querySelector<HTMLAnchorElement>('#location-directions');
  const calendar = document.getElementById('location-calendar');
  if (!address) return;

  const query = readAddress(address);

  if (directions && query) {
    directions.href = mapsUrl(query);
  }

  if (calendar) {
    calendar.addEventListener('click', () => {
      const event = readEvent(calendar, query);
      if (event) downloadIcs(buildIcs(event));
    });
  }
}

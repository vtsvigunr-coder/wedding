import { describe, expect, it } from 'vitest';
import { buildIcs, escapeIcsText, icsDateTime, mapsUrl } from './location';

describe('mapsUrl', () => {
  it('types the address into a maps search', () => {
    expect(mapsUrl('Grand Celebration Hall, 11th Avenue, New York State')).toBe(
      'https://www.google.com/maps/search/?api=1&query=Grand%20Celebration%20Hall%2C%2011th%20Avenue%2C%20New%20York%20State',
    );
  });

  it('escapes an address that would otherwise break the query', () => {
    expect(mapsUrl('Hall & Co #4')).toContain('query=Hall%20%26%20Co%20%234');
  });
});

describe('icsDateTime', () => {
  it('packs a local date-time the way iCalendar spells it', () => {
    expect(icsDateTime('2026-09-26T16:00')).toBe('20260926T160000');
  });

  it('keeps seconds when they are given', () => {
    expect(icsDateTime('2026-09-26T16:00:30')).toBe('20260926T160030');
  });

  it('refuses anything that is not a local date-time', () => {
    expect(() => icsDateTime('26 September')).toThrow();
    expect(() => icsDateTime('2026-09-26T16:00Z')).toThrow();
  });
});

describe('escapeIcsText', () => {
  it('quotes the separators a value would otherwise be split on', () => {
    expect(escapeIcsText('Hall, 11th Ave; back\\door')).toBe('Hall\\, 11th Ave\\; back\\\\door');
  });

  it('folds a line break into its escape', () => {
    expect(escapeIcsText('one\r\ntwo')).toBe('one\\ntwo');
  });
});

describe('buildIcs', () => {
  const event = {
    title: 'Zohan & Rose — Wedding',
    start: '2026-09-26T16:00',
    end: '2026-09-26T21:00',
    location: 'Grand Celebration Hall, 11th Avenue, New York State',
  };
  const ics = buildIcs(event, new Date('2026-08-03T09:30:00Z'));

  it('is a single-event calendar', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
  });

  it('writes the times as floating local time, with no zone appended', () => {
    expect(ics).toContain('DTSTART:20260926T160000\r\n');
    expect(ics).toContain('DTEND:20260926T210000\r\n');
  });

  it('stamps the file with the moment it was built', () => {
    expect(ics).toContain('DTSTAMP:20260803T093000Z');
  });

  it('carries the escaped title and address', () => {
    expect(ics).toContain('SUMMARY:Zohan & Rose — Wedding');
    expect(ics).toContain('LOCATION:Grand Celebration Hall\\, 11th Avenue\\, New York State');
  });

  it('gives the same event the same id every time, so re-adding it does not duplicate', () => {
    expect(buildIcs(event, new Date('2027-01-01T00:00:00Z'))).toContain(
      'UID:20260926T160000-wedding@invitation',
    );
  });

  it('leaves the description out when there is none', () => {
    expect(ics).not.toContain('DESCRIPTION');
    expect(buildIcs({ ...event, description: 'Bring a coat' })).toContain('DESCRIPTION:Bring a coat');
  });

  it('separates every line with CRLF', () => {
    expect(ics.split('\r\n').some((line) => line.includes('\n'))).toBe(false);
  });
});

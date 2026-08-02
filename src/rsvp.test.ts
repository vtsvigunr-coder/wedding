import { describe, expect, it } from 'vitest';
import { encodeFields, isConfigured, readFields, validate } from './rsvp';

const names = { attendance: 'entry.1', guest: 'entry.2' };

function formWith(html: string): HTMLFormElement {
  const form = document.createElement('form');
  form.innerHTML = html;
  return form;
}

describe('readFields', () => {
  it('keys the answers by the Google entry ids in the markup', () => {
    const form = formWith(`
      <input type="radio" name="entry.1" value="yes" checked />
      <input type="text" name="entry.2" value="Alexei" />
      <textarea name="entry.3">See you there</textarea>
    `);
    expect(readFields(form)).toEqual({
      'entry.1': 'yes',
      'entry.2': 'Alexei',
      'entry.3': 'See you there',
    });
  });

  it('leaves an unanswered question out entirely', () => {
    const form = formWith(`
      <input type="radio" name="entry.1" value="yes" />
      <input type="text" name="entry.2" value="" />
    `);
    expect(readFields(form)).toEqual({ 'entry.2': '' });
  });
});

describe('validate', () => {
  it('passes answers that have both required questions filled in', () => {
    expect(validate({ 'entry.1': 'yes', 'entry.2': 'Alexei' }, names)).toBeNull();
  });

  it('asks for an answer before a name', () => {
    expect(validate({ 'entry.2': 'Alexei' }, names)).toMatch(/whether you can come/);
  });

  it('asks for a name that is missing or only spaces', () => {
    expect(validate({ 'entry.1': 'no' }, names)).toMatch(/your name/);
    expect(validate({ 'entry.1': 'no', 'entry.2': '   ' }, names)).toMatch(/your name/);
  });

  it('does not require the optional message', () => {
    expect(validate({ 'entry.1': 'yes', 'entry.2': 'Alexei', 'entry.3': '' }, names)).toBeNull();
  });
});

describe('encodeFields', () => {
  it('posts the answers as a form body', () => {
    expect(encodeFields({ 'entry.1': 'Yes, with pleasure!', 'entry.2': 'Alexei' })).toBe(
      'entry.1=Yes%2C+with+pleasure%21&entry.2=Alexei',
    );
  });
});

describe('isConfigured', () => {
  it('recognises a real Google Form endpoint', () => {
    expect(isConfigured('https://docs.google.com/forms/d/e/1FAIpQL.../formResponse')).toBe(true);
  });

  it('rejects the placeholder the markup ships with', () => {
    expect(isConfigured('https://docs.google.com/forms/d/e/FORM_ID/formResponse')).toBe(false);
    expect(isConfigured(undefined)).toBe(false);
    expect(isConfigured('')).toBe(false);
  });
});

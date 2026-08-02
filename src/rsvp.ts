/**
 * The RSVP form. Answers go to a Google Form: every field carries its Google
 * `entry.<id>` as its `name`, so the mapping between what the guest fills in
 * and where it lands lives in the markup, and this file only has to serialise
 * the form and post it.
 *
 * Google's endpoint sends no CORS headers, so the request goes out `no-cors`.
 * That makes the response opaque: a request that resolves is treated as
 * delivered, and only a network failure counts as an error. Google accepts the
 * submission all the same.
 */

export type RsvpState = 'idle' | 'sending' | 'sent' | 'error';

export interface RsvpFields {
  [name: string]: string;
}

/** Everything the guest typed, keyed by the Google entry ids in the markup. */
export function readFields(form: HTMLFormElement): RsvpFields {
  const fields: RsvpFields = {};
  for (const [name, value] of new FormData(form)) {
    if (typeof value === 'string') fields[name] = value;
  }
  return fields;
}

/**
 * What is wrong with the answers, or null when they are good to send. Only the
 * two questions the design marks as required are checked — the message is
 * explicitly optional.
 */
export function validate(fields: RsvpFields, names: { attendance: string; guest: string }): string | null {
  if (!fields[names.attendance]) return 'Please tell us whether you can come.';
  if (!fields[names.guest]?.trim()) return 'Please tell us your name.';
  return null;
}

export function encodeFields(fields: RsvpFields): string {
  return new URLSearchParams(fields).toString();
}

/**
 * True once the form has been pointed at a real Google Form. Until then the
 * markup still carries the placeholder ids and there is nowhere to post.
 */
export function isConfigured(action: string | undefined): action is string {
  return !!action && !action.includes('FORM_ID');
}

export async function submit(action: string, fields: RsvpFields): Promise<void> {
  await fetch(action, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: encodeFields(fields),
  });
}

export function initRsvp(): void {
  const form = document.querySelector<HTMLFormElement>('#rsvp-form');
  const status = document.getElementById('rsvp-status');
  const button = document.querySelector<HTMLButtonElement>('#rsvp-send');
  if (!form || !status || !button) return;

  const names = {
    attendance: form.dataset.attendanceField ?? '',
    guest: form.dataset.guestField ?? '',
  };

  const setState = (state: RsvpState, message = '') => {
    form.dataset.state = state;
    button.disabled = state === 'sending';
    status.textContent = message;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const fields = readFields(form);
    const problem = validate(fields, names);
    if (problem) {
      setState('error', problem);
      return;
    }

    if (!isConfigured(form.action)) {
      setState('error', 'The form is not connected yet — please tell the couple directly.');
      return;
    }

    setState('sending', 'Sending…');
    try {
      await submit(form.action, fields);
      setState('sent', 'Thank you! Your answer is on its way to us.');
      form.reset();
    } catch {
      setState('error', 'That did not go through. Please try again in a moment.');
    }
  });

  // A fresh attempt after a rejected one should not keep shouting at the guest.
  form.addEventListener('input', () => {
    if (form.dataset.state === 'error') setState('idle');
  });
}

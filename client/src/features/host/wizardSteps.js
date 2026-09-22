/**
 * The create-tournament wizard, described as data.
 *
 * Each step names the fields it owns, so "is this step valid?" is one call to
 * react-hook-form's `trigger` with that list, and the progress indicator, the
 * validation, and the review screen all read from the same definition. The
 * original asked for all of this on one screen backed by forty-four `useState`
 * calls, with validation spread across a 130-line submit handler.
 */

export const STEPS = [
  {
    id: 'format',
    title: 'Format',
    summary: 'Brackets or battle royale, solo or teams.',
    fields: ['type', 'teamSize'],
  },
  {
    id: 'details',
    title: 'Details',
    summary: 'What it is called and what it is about.',
    fields: ['title', 'category', 'description', 'rules'],
  },
  {
    id: 'entry',
    title: 'Entry',
    summary: 'Who can enter, and how many.',
    fields: ['accessibility', 'maxCapacity', 'startDate', 'endDate'],
  },
  {
    id: 'application',
    title: 'Application form',
    summary: 'The questions applicants answer.',
    fields: ['applicationForm'],
    /** Only asked for when the host has gated entry behind an application. */
    when: (values) => values.accessibility === 'application required',
  },
  {
    id: 'contact',
    title: 'Contact',
    summary: 'How entrants reach you. All optional.',
    fields: ['contactEmail', 'contactPhone', 'discord', 'instagram', 'twitter', 'facebook'],
  },
  {
    id: 'review',
    title: 'Review',
    summary: 'Check it over before it goes live.',
    fields: [],
  },
]

/** The steps that apply, given what has been filled in so far. */
export const visibleSteps = (values) => STEPS.filter((step) => !step.when || step.when(values))

/** Bracket capacities. A single-elimination draw only works on a power of two. */
export const BRACKET_SIZES = [2, 4, 8, 16, 32, 64, 128, 256]

/**
 * Turns the flat form state into the request body the API expects.
 *
 * The contact fields are flat in the form because a flat form is easier to
 * validate and to lay out; the API wants them nested.
 */
export function toCreatePayload(values) {
  return {
    title: values.title.trim(),
    type: values.type,
    category: values.category,
    accessibility: values.accessibility,
    teamSize: Number(values.teamSize),
    maxCapacity: Number(values.maxCapacity),
    description: values.description ?? '',
    rules: values.rules ?? '',
    startDate: new Date(values.startDate).toISOString(),
    endDate: new Date(values.endDate).toISOString(),
    applicationForm:
      values.accessibility === 'application required'
        ? values.applicationForm.map((entry) => entry.label.trim()).filter(Boolean)
        : [],
    contactInfo: {
      email: values.contactEmail?.trim() || undefined,
      phone: values.contactPhone?.trim() || undefined,
      socialMedia: {
        discord: values.discord?.trim() || undefined,
        instagram: values.instagram?.trim() || undefined,
        twitter: values.twitter?.trim() || undefined,
        facebook: values.facebook?.trim() || undefined,
      },
    },
  }
}

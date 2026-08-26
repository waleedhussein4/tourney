/** Presentation helpers shared across features. */

const DATE = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const DATE_TIME = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
})

export const formatDate = (value) => (value ? DATE.format(new Date(value)) : '')

export const formatDateTime = (value) => (value ? DATE_TIME.format(new Date(value)) : '')

/** "12 credits", "1 credit", "Free". */
export function formatCredits(amount) {
  if (!amount) return 'Free'
  return `${amount} ${amount === 1 ? 'credit' : 'credits'}`
}

/** Turns a category slug into the label a reader expects. */
export const formatCategory = (slug) =>
  String(slug ?? '')
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

export const formatType = (type) => (type === 'brackets' ? 'Brackets' : 'Battle royale')

/**
 * Where a tournament is in its life, as a label and a badge tone.
 *
 * @returns {{label: string, tone: 'neutral'|'accent'|'success'|'warning'}}
 */
export function tournamentStatus(tournament) {
  if (tournament.hasEnded) return { label: 'Finished', tone: 'neutral' }
  if (tournament.hasStarted) return { label: 'Under way', tone: 'success' }

  const full = tournament.participantCount >= tournament.maxCapacity
  if (full) return { label: 'Full', tone: 'warning' }

  return { label: 'Open', tone: 'accent' }
}

/** "3 of 8 players" / "2 of 4 teams". */
export function formatCapacity({ participantCount, maxCapacity, teamSize }) {
  const noun = teamSize > 1 ? 'teams' : 'players'
  return `${participantCount ?? 0} of ${maxCapacity} ${noun}`
}

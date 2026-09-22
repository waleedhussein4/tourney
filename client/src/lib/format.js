/** Presentation helpers shared across features. */

import { categoryName } from '/src/components/brand/index.js'

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

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  // $5 rather than $5.00, but $12.50 keeps its cents.
  trailingZeroDisplay: 'stripIfInteger',
})

export const formatDate = (value) => (value ? DATE.format(new Date(value)) : '')

export const formatDateTime = (value) => (value ? DATE_TIME.format(new Date(value)) : '')

/**
 * Real money, from cents: "$5", "$12.50".
 *
 * Used for the one amount the site actually charges — the hosting
 * subscription. Everything else money-shaped (an entry fee, a prize) is a
 * plain dollar amount the host typed, and goes through `formatMoney` instead.
 */
export function formatUsd(cents) {
  if (cents === 0) return 'Free'
  if (cents == null) return ''
  return USD.format(cents / 100)
}

/**
 * What a host says an entry fee or a prize is worth: "$5", "$12.50", "Free".
 *
 * This money never touches the site — it changes hands between the host and
 * their players — so this is a label, not a balance.
 */
export function formatMoney(amount) {
  if (!amount) return 'Free'
  return USD.format(amount)
}

/**
 * Turns a category slug into the label a reader expects.
 *
 * The category table owns the names, because title-casing a slug gets "Moba"
 * where a reader expects "MOBA".
 */
export const formatCategory = categoryName

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

/**
 * The publishing badge, or `null` once it is published.
 *
 * A published tournament says nothing — that is the normal state, and a badge
 * on every tournament that is working correctly is a badge nobody reads.
 */
export function publishStatus(publishState) {
  if (publishState === 'draft') return { label: 'Draft', tone: 'neutral' }
  return null
}

/** "3 of 8 players" / "2 of 4 teams". */
export function formatCapacity({ participantCount, maxCapacity, teamSize }) {
  const noun = teamSize > 1 ? 'teams' : 'players'
  return `${participantCount ?? 0} of ${maxCapacity} ${noun}`
}

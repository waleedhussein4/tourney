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
 * Publishing fees are the one amount in the app that is not credits, so the
 * dollar sign is always shown — a bare number next to a credit balance is how
 * the two get read as the same thing.
 */
export function formatUsd(cents) {
  if (cents === 0) return 'Free'
  if (cents == null) return ''
  return USD.format(cents / 100)
}

/** "12 credits", "1 credit", "Free". */
export function formatCredits(amount) {
  if (!amount) return 'Free'
  return `${amount} ${amount === 1 ? 'credit' : 'credits'}`
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
  if (publishState === 'pending_payment') return { label: 'Awaiting payment', tone: 'warning' }
  return null
}

/** "3 of 8 players" / "2 of 4 teams". */
export function formatCapacity({ participantCount, maxCapacity, teamSize }) {
  const noun = teamSize > 1 ? 'teams' : 'players'
  return `${participantCount ?? 0} of ${maxCapacity} ${noun}`
}

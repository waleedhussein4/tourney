// Ending a tournament: work out who won what, pay it out of the bank, and hand
// the host whatever is left.
//
// Credits are whole numbers, so a prize split between team members is divided
// with the remainder handed out one credit at a time rather than rounded — the
// bank must end at exactly zero, not approximately.

import { creditUser, debitBank, recordTransaction } from './bank.service.js'

/**
 * Splits `amount` into `count` whole shares that sum back to `amount`.
 *
 * @returns {number[]} the shares, largest first
 */
export function splitEvenly(amount, count) {
  if (count <= 0) return []
  const base = Math.floor(amount / count)
  const remainder = amount - base * count
  return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0))
}

/**
 * The final standings, best first.
 *
 * Brackets rank by how far a competitor got: the champion, then whoever they beat
 * in the final, and so on backwards through the match list. Battle royale ranks
 * by score.
 */
export function finalStandings(tournament) {
  const ids = tournament.participantIds()

  if (tournament.type === 'battle royale') {
    const participants = tournament.participants()
    return [...participants]
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .map((participant) => tournament.participantId(participant))
  }

  // Brackets: the champion is the last recorded winner. Everyone else keeps the
  // enrolment order behind them — a single-elimination bracket only ever pays
  // its winner, so the rest of the order carries no money.
  const champion = [...tournament.matches].reverse().find(Boolean) ?? null
  if (!champion) return ids
  return [champion, ...ids.filter((id) => id !== champion)]
}

/**
 * Everyone a prize is owed to, and how much.
 *
 * @returns {{participantId: string, amount: number, rank: number}[]}
 */
export function prizeAllocations(tournament) {
  const standings = finalStandings(tournament)

  if (tournament.type === 'brackets') {
    const champion = standings[0]
    if (!champion || !tournament.prize) return []
    return [{ participantId: champion, amount: tournament.prize, rank: 1 }]
  }

  return tournament.prizes
    .filter((entry) => entry.prize > 0)
    .map((entry) => ({
      participantId: standings[entry.rank - 1] ?? null,
      amount: entry.prize,
      rank: entry.rank,
    }))
    .filter((allocation) => allocation.participantId !== null)
}

/**
 * Turns a participant-level allocation into per-user payments.
 *
 * A solo participant is paid directly. A team's prize is split equally among the
 * members who actually competed — the original code paid the whole prize to the
 * team leader for brackets, which is not what the rules say.
 */
function paymentsFor(tournament, allocation) {
  if (!tournament.isTeamBased) {
    return [{ userId: allocation.participantId, amount: allocation.amount }]
  }

  const team = tournament.enrolledTeams.find(
    (entry) => String(entry.teamId) === allocation.participantId
  )
  if (!team || team.members.length === 0) return []

  const shares = splitEvenly(allocation.amount, team.members.length)
  return team.members.map((member, index) => ({
    userId: String(member.userId),
    amount: shares[index],
  }))
}

/**
 * Pays out every prize and then the remainder of the bank to the host, inside
 * the caller's transaction. Returns what was paid, for the response.
 */
export async function payOutTournament(tournament, session) {
  const payouts = []

  for (const allocation of prizeAllocations(tournament)) {
    for (const payment of paymentsFor(tournament, allocation)) {
      if (payment.amount <= 0) continue

      await debitBank(tournament._id, payment.amount, session)
      await creditUser(payment.userId, payment.amount, session)
      await recordTransaction(
        {
          userId: payment.userId,
          type: 'payout',
          amount: payment.amount,
          tournamentId: tournament._id,
          description: `Rank ${allocation.rank} in "${tournament.title}"`,
        },
        session
      )

      payouts.push({ userId: payment.userId, amount: payment.amount, rank: allocation.rank })
      tournament.bank -= payment.amount
    }
  }

  // Whatever the prize table did not claim — entry fees above the prize pool,
  // ranks nobody finished in — belongs to the host.
  const remainder = tournament.bank
  if (remainder > 0) {
    await debitBank(tournament._id, remainder, session)
    await creditUser(tournament.host, remainder, session)
    await recordTransaction(
      {
        userId: tournament.host,
        type: 'payout',
        amount: remainder,
        tournamentId: tournament._id,
        description: `Remaining bank from "${tournament.title}"`,
      },
      session
    )
    tournament.bank = 0
  }

  return { payouts, hostRemainder: remainder }
}

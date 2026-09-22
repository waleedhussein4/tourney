/**
 * Turns the stored bracket into rounds a bracket component can draw.
 *
 * The server stores one match subdocument per bracket slot — `round`, `slot`,
 * its `participants`, and its `winner` — round 1 first, then each subsequent
 * round, halving each time. Round 1's `participants` come from the draw;
 * later rounds are recomputed here from each match's winner rather than read
 * off the stored `participants`, so a `winnerOverrides` override
 * (`{ [matchId]: winnerId }`) immediately fills in who a later round would be
 * playing, before the pick is saved.
 *
 * A slot with no participant yet, or an undecided match, stays `null` here, so
 * a half-played bracket renders as "TBA" rather than crashing.
 *
 * @param {object} tournament
 * @param {Record<string, string|null>} [winnerOverrides]
 * @returns {{title: string, seeds: {id: string, teams: {id: string|null, name: string,
 *            score: number|null, eliminated: boolean, isWinner: boolean}[]}[]}[]}
 */
export function buildRounds(tournament, winnerOverrides = {}) {
  const byId = new Map((tournament.participants ?? []).map((entry) => [entry.id, entry]))

  const describe = (id, winnerId) => {
    const participant = id ? byId.get(id) : null
    return {
      id: id ?? null,
      name: participant?.name ?? null,
      score: participant?.score ?? null,
      eliminated: Boolean(id) && Boolean(winnerId) && winnerId !== id,
      isWinner: Boolean(id) && winnerId === id,
    }
  }

  const matches = tournament.matches ?? []
  if (matches.length === 0) return []

  const winnerOf = (match) =>
    Object.hasOwn(winnerOverrides, match.id) ? winnerOverrides[match.id] : match.winner

  const byRound = new Map()
  for (const match of matches) {
    if (!byRound.has(match.round)) byRound.set(match.round, [])
    byRound.get(match.round).push(match)
  }
  const roundNumbers = [...byRound.keys()].sort((a, b) => a - b)

  // Round 1's pairs come from the draw. Every later round is rebuilt from the
  // previous round's winners, so an unsaved pick is reflected right away.
  const participantsByKey = new Map(
    (byRound.get(roundNumbers[0]) ?? []).map((match) => [
      `${match.round}-${match.slot}`,
      match.participants,
    ])
  )

  return roundNumbers.map((roundNumber) => {
    const roundMatches = [...byRound.get(roundNumber)].sort((a, b) => a.slot - b.slot)
    const isFinal = roundNumber === roundNumbers[roundNumbers.length - 1]

    const seeds = roundMatches.map((match) => {
      const participants = participantsByKey.get(`${match.round}-${match.slot}`) ?? [null, null]
      const winnerId = winnerOf(match)

      if (!isFinal) {
        const nextKey = `${match.round + 1}-${Math.floor(match.slot / 2)}`
        const next = participantsByKey.get(nextKey) ?? [null, null]
        next[match.slot % 2] = winnerId ?? null
        participantsByKey.set(nextKey, next)
      }

      return {
        id: match.id,
        teams: [
          describe(participants[0] ?? null, winnerId),
          describe(participants[1] ?? null, winnerId),
        ],
      }
    })

    return { title: roundTitle(roundNumber, roundMatches.length * 2), seeds }
  })
}

function roundTitle(roundNumber, entrantsThisRound) {
  if (entrantsThisRound === 2) return 'Final'
  if (entrantsThisRound === 4) return 'Semi-finals'
  if (entrantsThisRound === 8) return 'Quarter-finals'
  return `Round ${roundNumber}`
}

/** The champion, once the final has a result. */
export function championOf(tournament) {
  const matches = tournament.matches ?? []
  if (matches.length === 0) return null
  const final = [...matches].sort((a, b) => b.round - a.round)[0]
  if (!final?.winner) return null
  return (tournament.participants ?? []).find((entry) => entry.id === final.winner) ?? null
}

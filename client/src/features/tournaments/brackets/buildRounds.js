/**
 * Turns the stored bracket into rounds a bracket component can draw.
 *
 * The server stores two flat arrays: `bracketOrder`, the participant ids in slot
 * order, and `matches`, the winner of each match indexed round by round — round
 * one first, then each subsequent round, halving each time. Walking them
 * together reconstructs the tree.
 *
 * Empty slots and undecided matches are `null` throughout and stay `null` here,
 * so a half-played bracket renders as "TBA" rather than crashing. The original
 * padded `enrolledUsers` with nulls in the database to represent empty slots,
 * which every count and payout downstream then had to filter back out.
 *
 * @param {object} tournament
 * @returns {{title: string, seeds: {id: number, teams: {id: string|null, name: string,
 *            score: number|null, eliminated: boolean, isWinner: boolean}[]}[]}[]}
 */
export function buildRounds(tournament) {
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

  // A bracket always has `maxCapacity` slots, filled or not.
  let slots = [...(tournament.bracketOrder ?? [])]
  if (slots.length === 0) {
    slots = new Array(tournament.maxCapacity ?? 0).fill(null)
  }

  const matches = tournament.matches ?? []
  const rounds = []
  let matchIndex = 0
  let roundNumber = 1

  while (slots.length > 1) {
    const seeds = []
    const advancing = []

    for (let slot = 0; slot < slots.length; slot += 2) {
      const winnerId = matches[matchIndex] ?? null
      seeds.push({
        id: matchIndex,
        teams: [describe(slots[slot], winnerId), describe(slots[slot + 1] ?? null, winnerId)],
      })
      advancing.push(winnerId)
      matchIndex += 1
    }

    rounds.push({ title: roundTitle(roundNumber, slots.length), seeds })
    slots = advancing
    roundNumber += 1
  }

  return rounds
}

function roundTitle(roundNumber, entrantsThisRound) {
  if (entrantsThisRound === 2) return 'Final'
  if (entrantsThisRound === 4) return 'Semi-finals'
  if (entrantsThisRound === 8) return 'Quarter-finals'
  return `Round ${roundNumber}`
}

/** The champion, once the final has a result. */
export function championOf(tournament) {
  const decided = [...(tournament.matches ?? [])].reverse().find(Boolean)
  if (!decided) return null
  return (tournament.participants ?? []).find((entry) => entry.id === decided) ?? null
}

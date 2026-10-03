import { describe, expect, it } from 'vitest'
import { bracketChampion } from '../src/modules/tournaments/payout.service.js'

// `matches` is an array of subdocuments, not winner ids; the champion is the
// winner of the final, and only once the final is `final`.
const match = (round, slot, winner, state) => ({ round, slot, winner, state })

describe('bracketChampion', () => {
  it('takes the winner of the final match', () => {
    const tournament = {
      matches: [match(1, 0, 'a', 'final'), match(1, 1, 'c', 'final'), match(2, 0, 'c', 'final')],
    }
    expect(bracketChampion(tournament)).toBe('c')
  })

  it('is null while the final is reported but not confirmed', () => {
    const tournament = {
      matches: [match(1, 0, 'a', 'final'), match(1, 1, 'c', 'final'), match(2, 0, 'a', 'reported')],
    }
    expect(bracketChampion(tournament)).toBeNull()
  })

  it('is null when the final has no winner, even if an earlier round does', () => {
    const tournament = { matches: [match(1, 0, 'a', 'final'), match(2, 0, null, 'pending')] }
    expect(bracketChampion(tournament)).toBeNull()
  })

  it('is null for a bracket with no matches', () => {
    expect(bracketChampion({ matches: [] })).toBeNull()
  })
})

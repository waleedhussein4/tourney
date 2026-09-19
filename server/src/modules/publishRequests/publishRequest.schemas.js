import { z } from 'zod'

const uuid = z.string().uuid('Not a valid id')

export const tournamentIdParams = z.object({ tournamentId: uuid })

export const requestIdParams = z.object({ requestId: uuid })

// An admin can confirm or reject with no body at all. Strict, so a misspelt
// `paymentref` is an error rather than a silently lost payment reference.
export const confirmSchema = z
  .object({ paymentRef: z.string().trim().min(1).max(64).optional() })
  .strict()

export const rejectSchema = z
  .object({ reason: z.string().trim().min(1).max(280).optional() })
  .strict()

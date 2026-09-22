import { z } from 'zod'

const uuid = z.string().uuid('Not a valid id')

export const userIdParams = z.object({ userId: uuid })

export const tournamentIdParams = z.object({ tournamentId: uuid })

export const reasonSchema = z.object({
  reason: z.string().trim().min(1, 'A reason is required').max(500),
})

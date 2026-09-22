import { z } from 'zod'

export const tournamentIdParams = z.object({ tournamentId: z.string().uuid('Not a valid id') })

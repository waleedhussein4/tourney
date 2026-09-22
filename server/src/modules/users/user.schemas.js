import { z } from 'zod'

export const userIdParams = z.object({ userId: z.string().uuid('Not a valid id') })

export const reportUserSchema = z.object({
  reason: z.string().trim().min(1, 'A reason is required').max(2000),
})

import { z } from 'zod'

export const transactionQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
})

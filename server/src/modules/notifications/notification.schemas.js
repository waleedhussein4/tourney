import { z } from 'zod'

export const notificationIdParams = z.object({ notificationId: z.string().uuid('Not a valid id') })

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
})

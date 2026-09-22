import { z } from 'zod'
import { EMAIL_CATEGORIES } from './notification.service.js'

export const notificationIdParams = z.object({ notificationId: z.string().uuid('Not a valid id') })

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
})

export const updatePreferencesSchema = z
  .object(
    Object.fromEntries(EMAIL_CATEGORIES.map((category) => [category, z.boolean().optional()]))
  )
  .refine((value) => Object.keys(value).length > 0, 'At least one preference is required')

export const unsubscribeSchema = z.object({
  userId: z.string().uuid('Not a valid id'),
  category: z.enum(EMAIL_CATEGORIES),
  token: z.string().min(1, 'Token is required'),
})

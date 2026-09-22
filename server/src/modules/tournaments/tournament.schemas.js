import { z } from 'zod'
import { ACCESSIBILITY, CATEGORY_SLUGS, LIMITS, PAGE_SIZE } from '../../config/constants.js'

const uuid = z.string().uuid('Not a valid id')

export const tournamentIdParams = z.object({ tournamentId: uuid })

export const applicationParams = z.object({ tournamentId: uuid, applicationId: uuid })

export const matchParams = z.object({ tournamentId: uuid, matchId: uuid })

const contactInfoSchema = z
  .object({
    email: z.string().trim().email('Enter a valid contact email').or(z.literal('')).optional(),
    phone: z.string().trim().max(32).optional(),
    socialMedia: z
      .object({
        discord: z.string().trim().max(64).optional(),
        instagram: z.string().trim().max(64).optional(),
        twitter: z.string().trim().max(64).optional(),
        facebook: z.string().trim().max(64).optional(),
      })
      // Unknown keys are an error rather than silently dropped, so a typo in the
      // form surfaces instead of vanishing.
      .strict()
      .optional(),
  })
  .strict()

/** The fields every tournament has, whatever its format. */
const commonCreateFields = {
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(LIMITS.title),
  category: z.enum(CATEGORY_SLUGS, { errorMap: () => ({ message: 'Unknown category' }) }),
  accessibility: z.enum(ACCESSIBILITY),
  teamSize: z.coerce.number().int().min(1, 'Team size must be at least 1').max(16),
  description: z.string().max(20_000).optional().default(''),
  rules: z.string().max(40_000).optional().default(''),
  contactInfo: contactInfoSchema.optional(),
  applicationForm: z
    .array(z.string().trim().min(1).max(80))
    .max(LIMITS.applicationFields, `At most ${LIMITS.applicationFields} questions`)
    .optional()
    .default([]),
  startDate: z.coerce.date({ invalid_type_error: 'Enter a valid start date' }),
  endDate: z.coerce.date({ invalid_type_error: 'Enter a valid end date' }),
}

const isPowerOfTwo = (value) => value >= 2 && (value & (value - 1)) === 0

export const createTournamentSchema = z
  .discriminatedUnion('type', [
    z.object({
      ...commonCreateFields,
      type: z.literal('brackets'),
      // A single-elimination bracket only works on a power of two, otherwise
      // some rounds have no opponent to pair against.
      maxCapacity: z.coerce
        .number()
        .int()
        .min(2)
        .max(256)
        .refine(isPowerOfTwo, 'A bracket needs a power-of-two number of slots (2, 4, 8, 16, …)'),
    }),
    z.object({
      ...commonCreateFields,
      type: z.literal('battle royale'),
      maxCapacity: z.coerce.number().int().min(2).max(1000),
    }),
  ])
  .superRefine((value, ctx) => {
    if (value.endDate <= value.startDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'The end must be after the start',
      })
    }
    if (value.accessibility === 'application required' && value.applicationForm.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['applicationForm'],
        message: 'An application-required tournament needs at least one question',
      })
    }
  })

/** Everything a host may still change once the tournament exists. */
export const updateTournamentSchema = z
  .object({
    title: commonCreateFields.title.optional(),
    description: z.string().max(20_000).optional(),
    rules: z.string().max(40_000).optional(),
    contactInfo: contactInfoSchema.optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, 'Nothing to update')

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(PAGE_SIZE.max).optional().default(PAGE_SIZE.default),
  search: z.string().trim().max(120).optional(),
  // "All"/"Any" are what the filter UI sends for "no filter".
  category: z.enum(CATEGORY_SLUGS).optional(),
  type: z.enum(['brackets', 'battle royale']).optional(),
  accessibility: z.enum(ACCESSIBILITY).optional(),
  status: z.enum(['upcoming', 'live', 'ended']).optional(),
})

export const joinTeamSchema = z.object({ teamId: uuid })

export const applySchema = z.object({
  teamId: uuid.optional(),
  fields: z
    .array(
      z.object({
        label: z.string().trim().min(1),
        input: z
          .string()
          .trim()
          .min(1, 'Every question must be answered')
          .max(LIMITS.applicationInput),
      })
    )
    .max(LIMITS.applicationFields),
})

export const updateBodySchema = z.object({
  content: z.string().trim().min(1, 'An update needs some text').max(LIMITS.update),
})

export const matchesSchema = z.object({
  /** Winners to record, by match id. `winner: null` clears a recorded result. */
  matches: z.array(z.object({ id: uuid, winner: uuid.nullable() })),
})

export const participantsSchema = z.object({
  participants: z
    .array(
      z.object({
        id: uuid,
        score: z.coerce.number().optional(),
        eliminated: z.coerce.boolean().optional(),
        members: z
          .array(
            z.object({
              id: uuid,
              score: z.coerce.number().optional(),
              eliminated: z.coerce.boolean().optional(),
            })
          )
          .optional(),
      })
    )
    .min(1, 'Nothing to update'),
})

export const reportMatchSchema = z.object({
  scores: z
    .array(z.object({ participantId: uuid, score: z.coerce.number() }))
    .length(2, 'Report a score for both competitors'),
})

export const confirmMatchSchema = z.object({ agree: z.boolean() })

export const trendingQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(24).optional().default(10),
})

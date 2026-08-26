import { z } from 'zod'
import { LIMITS } from '../../config/constants.js'

const uuid = z.string().uuid('Not a valid id')

export const teamIdParams = z.object({ teamId: uuid })

export const joinCodeParams = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .length(6, 'A join code is exactly 6 characters')
    .regex(/^[A-Z0-9]+$/, 'A join code contains only letters and digits'),
})

export const createTeamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Team name must be at least 3 characters')
    .max(LIMITS.teamName, `Team name must be at most ${LIMITS.teamName} characters`),
})

export const usernameBody = z.object({
  username: z.string().trim().min(1, 'Username is required'),
})

export const memberParams = z.object({
  teamId: uuid,
  username: z.string().trim().min(1),
})

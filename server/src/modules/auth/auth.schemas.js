import { z } from 'zod'

// The original project's rule, kept: long enough, and mixed enough that a
// dictionary word alone will not pass.
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .refine((value) => /[a-z]/.test(value), 'Password must contain a lowercase letter')
  .refine((value) => /[A-Z]/.test(value), 'Password must contain an uppercase letter')
  .refine((value) => /[0-9]/.test(value), 'Password must contain a number')

export const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(24, 'Username must be at most 24 characters')
    .regex(
      /^[a-zA-Z0-9_.-]+$/,
      'Username may only contain letters, numbers, dot, dash, underscore'
    ),
  password,
})

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
})

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  // Reusing the signup rule: a reset password must meet the same bar a new
  // one does.
  password,
})

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  // Deliberately not the strong-password schema: an old account with a weak
  // password must still be able to sign in and be told it was wrong, not be
  // told its own password is malformed.
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.coerce.boolean().optional().default(false),
})

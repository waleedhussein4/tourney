import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { creditsLimiter } from '../../middleware/rateLimits.js'
import * as controller from './credits.controller.js'

const productParams = z.object({ productId: z.string().trim().min(1).max(64) })

/** The catalogue. Public — a guest can see what credits cost before signing up. */
export const productRouter = Router()
productRouter.get('/', controller.listProducts)
productRouter.get('/:productId', validate({ params: productParams }), controller.getProduct)

/** The demo checkout. */
export const creditsRouter = Router()
creditsRouter.post(
  '/checkout/:productId',
  requireAuth,
  // Credits are free money here, so the cap is per account rather than per
  // address.
  creditsLimiter,
  validate({ params: productParams }),
  controller.checkout
)

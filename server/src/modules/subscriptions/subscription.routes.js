import { Router } from 'express'
import { requireAuth } from '../../middleware/auth.js'
import { checkoutLimiter } from '../../middleware/rateLimits.js'
import { CONTACT_EMAIL, FREE_LIVE_TOURNAMENTS, PLAN } from '../../config/plans.js'
import * as controller from './subscription.controller.js'

/** Mounted at /api/billing. */
export const billingRouter = Router()

/**
 * The price list, for anyone — the landing page quotes it while signed out.
 *
 * It carries no account state and no secret: the client token identifies the
 * gateway account and authorises nothing, which is what makes it safe in a
 * bundle the whole internet can read.
 */
billingRouter.get('/plan', (_req, res) => {
  res.json({
    plan: { name: PLAN.name, priceCents: PLAN.priceCents, interval: PLAN.interval },
    freeLiveTournaments: FREE_LIVE_TOURNAMENTS,
    contactEmail: CONTACT_EMAIL,
    currency: 'USD',
  })
})

billingRouter.get('/me', requireAuth, controller.getPlan)
billingRouter.post('/checkout', requireAuth, checkoutLimiter, controller.startCheckout)

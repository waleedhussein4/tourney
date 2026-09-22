import express, { Router } from 'express'
import * as gateway from '../../payments/paddle.js'
import * as service from './subscription.service.js'

/**
 * The payment gateway telling us a subscription changed.
 *
 * Mounted before the JSON body parser, because the signature is computed over
 * the bytes the gateway sent and a parsed-and-reserialised body is not those
 * bytes. `express.raw` here is what keeps the check meaningful.
 *
 * Answers 200 to anything it has verified, including events it does nothing
 * with. A gateway retries a non-2xx for days, so the only failures worth
 * reporting are the ones a retry could fix.
 */
export const webhookRouter = Router()

webhookRouter.post(
  '/paddle',
  express.raw({ type: 'application/json', limit: '512kb' }),
  async (req, res) => {
    let event
    try {
      event = await gateway.readEvent({
        rawBody: req.body.toString('utf8'),
        signature: req.get('Paddle-Signature'),
      })
    } catch {
      // An unverifiable delivery is not from the gateway, or the secret is
      // wrong. Either way a retry will not help, and nothing is reported that
      // would let a caller tell those two apart.
      res.sendStatus(400)
      return
    }

    if (!gateway.isSubscriptionEvent(event)) {
      res.sendStatus(200)
      return
    }

    const subscription = gateway.subscriptionFrom(event)
    await service.applySubscription({
      ...subscription,
      occurredAt: event.occurredAt ? new Date(event.occurredAt) : new Date(),
    })

    res.sendStatus(200)
  }
)

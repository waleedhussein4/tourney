import express, { Router } from 'express'
import { PUBLISH_TIERS } from '../../config/publishing.js'
import * as gateway from '../../payments/paddle.js'
import * as service from './publishRequest.service.js'

/**
 * The payment gateway telling us a host has paid.
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
      // wrong. Either way retrying will not help, and nothing is logged that
      // an attacker could use to tell the two apart.
      res.sendStatus(400)
      return
    }

    if (!gateway.isPaymentSettled(event)) {
      res.sendStatus(200)
      return
    }

    const payment = gateway.paymentFrom(event)

    // What the gateway charged has to match what the tier costs. The price
    // object lives in the gateway's dashboard and the amount lives in this
    // repository; this is the line where the two are held to each other, and it
    // is why a mispriced product cannot quietly publish a tournament.
    const expected = PUBLISH_TIERS.some((tier) => tier.amountCents === payment.totalCents)
    if (!payment.tournamentId || !expected) {
      res.sendStatus(200)
      return
    }

    await service.markPaid(payment.tournamentId, {
      provider: 'paddle',
      providerRef: payment.providerRef,
    })

    res.sendStatus(200)
  }
)

import { asyncHandler } from '../../utils/asyncHandler.js'
import { PUBLISH_TIERS, WHATSAPP_NUMBER } from '../../config/publishing.js'
import { toPublicView } from '../tournaments/tournament.presenter.js'
import * as service from './publishRequest.service.js'

function toView(request) {
  // `hostId` is populated by the list query and a bare id everywhere else.
  const host = request.hostId
  return {
    id: String(request._id),
    tournamentId: String(request.tournamentId),
    tournamentTitle: request.tournamentTitle,
    host: host?._id
      ? { id: String(host._id), name: host.username, email: host.email }
      : { id: String(host) },
    tier: request.tier,
    amountLbp: request.amountLbp,
    status: request.status,
    requestedAt: request.requestedAt,
    confirmedAt: request.confirmedAt,
    confirmedBy: request.confirmedBy,
    whishRef: request.whishRef,
    rejectedAt: request.rejectedAt,
    reason: request.reason,
  }
}

export const pricing = asyncHandler(async (_req, res) => {
  // The price list and the number to ask on. Not the Whish number: a host is
  // given that once they have a tournament to pay for.
  res.json({ tiers: PUBLISH_TIERS, whatsapp: WHATSAPP_NUMBER })
})

export const quote = asyncHandler(async (req, res) => {
  res.json({ publishing: await service.quote(req.params.tournamentId, req.userId) })
})

export const publish = asyncHandler(async (req, res) => {
  const tournament = await service.publish(req.params.tournamentId, req.userId)
  res.json({ tournament: await toPublicView(tournament, req.userId) })
})

export const list = asyncHandler(async (_req, res) => {
  const requests = await service.listPending()
  res.json({ requests: requests.map(toView) })
})

export const confirm = asyncHandler(async (req, res) => {
  const request = await service.confirm(req.params.requestId, req.userId, req.body.whishRef)
  res.json({ request: toView(request) })
})

export const reject = asyncHandler(async (req, res) => {
  const request = await service.reject(req.params.requestId, req.userId, req.body.reason)
  res.json({ request: toView(request) })
})

import { asyncHandler } from '../../utils/asyncHandler.js'
import * as service from './subscription.service.js'

export const getPlan = asyncHandler(async (req, res) => {
  res.json({ billing: await service.planFor(req.userId) })
})

export const startCheckout = asyncHandler(async (req, res) => {
  res.json({ checkout: await service.startCheckout(req.userId) })
})

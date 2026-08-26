import { asyncHandler } from '../../utils/asyncHandler.js'
import * as service from './credits.service.js'

export const listProducts = asyncHandler(async (_req, res) => {
  const products = await service.listProducts()
  res.json({ products: products.map((product) => product.toPublicJSON()) })
})

export const getProduct = asyncHandler(async (req, res) => {
  const product = await service.getProduct(req.params.productId)
  res.json({ product: product.toPublicJSON() })
})

export const checkout = asyncHandler(async (req, res) => {
  const { user, product } = await service.checkout(req.userId, req.params.productId)
  res.status(201).json({
    demo: true,
    granted: product.credits,
    product: product.toPublicJSON(),
    user: user.toPublicJSON(),
  })
})

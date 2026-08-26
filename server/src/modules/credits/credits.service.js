import Product from '../../models/product.model.js'
import { DEFAULT_PRODUCTS } from '../../config/products.js'
import config from '../../config/env.js'
import { withTransaction } from '../../db/withTransaction.js'
import { ApiError } from '../../utils/ApiError.js'
import { creditUser, recordTransaction } from '../tournaments/bank.service.js'

/**
 * Writes the default catalogue if the collection is empty.
 *
 * The original did this inside the `GET /products` handler, so a read request
 * wrote to the database. Seeding belongs to `scripts/seed.js`; this stays only
 * as a development convenience, so a fresh local database is not an empty shop.
 */
export async function ensureProducts() {
  if (config.isProduction) return
  if (await Product.exists({})) return
  await Product.insertMany(DEFAULT_PRODUCTS)
}

export async function listProducts() {
  await ensureProducts()
  return Product.find({}).sort({ credits: 1 })
}

export async function getProduct(productId) {
  await ensureProducts()
  const product = await Product.findById(productId)
  if (!product) throw ApiError.notFound('No such credit package')
  return product
}

/**
 * The demo checkout.
 *
 * There is no payment. No card details are read from the request — the client
 * never sends them, and nothing here would look at them if it did. The grant and
 * its ledger entry commit together, and the response says `demo: true` so the
 * client cannot present this as a real transaction.
 */
export async function checkout(userId, productId) {
  const product = await getProduct(productId)

  return withTransaction(async (session) => {
    const user = await creditUser(userId, product.credits, session)
    if (!user) throw ApiError.notFound('User not found')

    await recordTransaction(
      {
        userId,
        type: 'purchase',
        amount: product.credits,
        description: `Demo purchase: ${product.name}`,
      },
      session
    )

    return { user, product }
  })
}

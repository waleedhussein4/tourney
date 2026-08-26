import { beforeEach, describe, expect, it } from 'vitest'
import { useDatabase } from './setup/database.js'
import { creditsOf, guest, signUp, totalCredits } from './setup/api.js'
import Product from '../src/models/product.model.js'
import Transaction from '../src/models/transaction.model.js'
import User from '../src/models/user.model.js'
import { DEFAULT_PRODUCTS } from '../src/config/products.js'

useDatabase()

const STARTER = DEFAULT_PRODUCTS[0]

describe('GET /api/products', () => {
  it('lets a guest see what credits cost before signing up', async () => {
    const { body } = await guest().get('/api/products').expect(200)

    expect(body.products).toHaveLength(DEFAULT_PRODUCTS.length)
    expect(body.products[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      credits: expect.any(Number),
      price: expect.any(Number),
    })
  })

  it('returns the catalogue cheapest first', async () => {
    const { body } = await guest().get('/api/products').expect(200)

    const credits = body.products.map((product) => product.credits)
    expect([...credits].sort((a, b) => a - b)).toEqual(credits)
  })

  // The original seeded default products from inside the GET handler, so a read
  // request wrote to the database — and did it again after every wipe.
  it('does not grow the catalogue on repeated reads', async () => {
    await guest().get('/api/products').expect(200)
    await guest().get('/api/products').expect(200)
    await guest().get('/api/products').expect(200)

    expect(await Product.countDocuments()).toBe(DEFAULT_PRODUCTS.length)
  })
})

describe('GET /api/products/:productId', () => {
  it('returns one package', async () => {
    const { body } = await guest().get(`/api/products/${STARTER._id}`).expect(200)
    expect(body.product.credits).toBe(STARTER.credits)
  })

  // `getProductById` took `(productId)` and then called `res.setHeader(...)`,
  // referencing a `res` that was not in scope. Every call threw.
  it('answers 404 for an unknown package instead of throwing', async () => {
    const response = await guest().get('/api/products/no-such-package').expect(404)
    expect(response.body.error.message).toEqual(expect.any(String))
  })
})

describe('POST /api/credits/checkout/:productId', () => {
  it('requires a signed-in caller', async () => {
    await guest().post(`/api/credits/checkout/${STARTER._id}`).expect(401)
  })

  it('grants exactly the package credits and says it is a demo', async () => {
    const { agent, user } = await signUp('ada')

    const { body } = await agent.post(`/api/credits/checkout/${STARTER._id}`).expect(201)

    expect(body.demo).toBe(true)
    expect(body.granted).toBe(STARTER.credits)
    expect(body.user.credits).toBe(STARTER.credits)
    expect(await creditsOf(user.id)).toBe(STARTER.credits)
  })

  it('writes one purchase row to the ledger', async () => {
    const { agent, user } = await signUp('ada')

    await agent.post(`/api/credits/checkout/${STARTER._id}`).expect(201)

    const ledger = await Transaction.find({ userId: user.id }).lean()
    expect(ledger).toHaveLength(1)
    expect(ledger[0]).toMatchObject({ type: 'purchase', amount: STARTER.credits })
  })

  it('is the only way credits enter the system', async () => {
    const before = await totalCredits()
    const { agent } = await signUp('ada')

    await agent.post(`/api/credits/checkout/${STARTER._id}`).expect(201)

    expect(await totalCredits()).toBe(before + STARTER.credits)
  })

  it('answers 404 for a package that does not exist, granting nothing', async () => {
    const { agent, user } = await signUp('ada')

    await agent.post('/api/credits/checkout/no-such-package').expect(404)

    expect(await creditsOf(user.id)).toBe(0)
    expect(await Transaction.countDocuments()).toBe(0)
  })
})

// The checkout is where the original leaked credits. These are the specific
// holes, kept as tests so they cannot reopen.
describe('regression: the free-credit exploits', () => {
  let agent
  let user

  beforeEach(async () => {
    const account = await signUp('ada')
    agent = account.agent
    user = account.user
  })

  it('ignores any amount the caller puts in the body', async () => {
    await agent
      .post(`/api/credits/checkout/${STARTER._id}`)
      .send({ amount: 999_999, credits: 999_999, price: 0 })
      .expect(201)

    expect(await creditsOf(user.id)).toBe(STARTER.credits)
  })

  // `POST /api/user/removeEarn` took `winnerPrize` straight from the body and
  // ran `user.credits -= winnerPrize`. A negative number printed money.
  it('has no endpoint that subtracts a caller-supplied amount', async () => {
    for (const path of ['/api/user/removeEarn', '/api/users/me/removeEarn']) {
      const response = await agent.post(path).send({ winnerPrize: -1000 })
      expect(response.status).toBe(404)
    }

    expect(await creditsOf(user.id)).toBe(0)
  })

  it('has no unauthenticated purchase route left', async () => {
    for (const path of [
      `/api/purchase/${STARTER._id}`,
      '/api/purchase',
      '/api/user/payment',
      `/api/purchase/getProduct/${STARTER._id}`,
    ]) {
      const response = await guest().post(path).send({})
      expect(response.status).toBe(404)
    }
  })

  it('grants a package once per request, not once per retry of the same click', async () => {
    // Repeat purchases are legitimate — this pins the amount, so a bug that
    // multiplied the grant by anything would show up here.
    await agent.post(`/api/credits/checkout/${STARTER._id}`).expect(201)
    await agent.post(`/api/credits/checkout/${STARTER._id}`).expect(201)

    expect(await creditsOf(user.id)).toBe(STARTER.credits * 2)
    expect(await Transaction.countDocuments({ userId: user.id })).toBe(2)
  })

  it('cannot be raced into granting more than it charges for', async () => {
    const results = await Promise.all([
      agent.post(`/api/credits/checkout/${STARTER._id}`),
      agent.post(`/api/credits/checkout/${STARTER._id}`),
      agent.post(`/api/credits/checkout/${STARTER._id}`),
    ])

    const granted = results.filter((result) => result.status === 201).length
    expect(await creditsOf(user.id)).toBe(STARTER.credits * granted)
    expect(await Transaction.countDocuments({ userId: user.id })).toBe(granted)
  })

  // The checkout page used to post the card number and CCV in the request body.
  it('never stores card details, even when a client sends them', async () => {
    await agent
      .post(`/api/credits/checkout/${STARTER._id}`)
      .send({ creditCardNumber: '4111111111111111', ccv: '123', firstName: 'Ada' })
      .expect(201)

    const [ledger, users] = await Promise.all([Transaction.find({}).lean(), User.find({}).lean()])
    const everything = JSON.stringify({ ledger, users })

    expect(everything).not.toContain('4111111111111111')
    expect(everything).not.toContain('ccv')
  })
})

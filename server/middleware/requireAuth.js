import jwt from 'jsonwebtoken'
import User from '../src/models/user.model.js'

const auth = async (req, res, next) => {
  try {
    const token = req.cookies.token

    if (!token) return res.status(401).json({ error: "Request is not authorized" })

    const payload = jwt.verify(token, process.env.SECRET)
    const _id = payload.sub ?? payload._id

    await User.findOne({ _id }).select('_id')
    req.user = _id
    next()

  } catch (error) {
    console.log(error)
    res.status(401).json({ error: 'Request is not authorized' })
  }
}

const getAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token

    if (!token) {
      req.user = null
      return next()
    }

    const payload = jwt.verify(token, process.env.SECRET)
    const _id = payload.sub ?? payload._id

    await User.findOne({ _id }).select('_id')
    req.user = _id
    next()

  } catch (error) {
    console.log(error)
    req.user = null
    next()
  }
}

const admin = async (req, res, next) => {
  try {
    const token = req.cookies.token

    if (!token) return res.status(401).json({ error: "Request is not authorized" })

    const payload = jwt.verify(token, process.env.SECRET)
    const _id = payload.sub ?? payload._id

    const user = await User.findOne({ _id }).select('role')
    if (user.role !== 'admin') return res.status(401).json({ error: "Request is not authorized" })

    req.user = _id
    next()

  } catch (error) {
    console.log(error)
    res.status(401).json({ error: 'Request is not authorized' })
  }
}

export {
  auth,
  getAuth,
  admin,
}

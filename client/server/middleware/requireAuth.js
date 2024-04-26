const jwt = require('jsonwebtoken')
const User = require('../models/userModel')

const auth = async (req, res, next) => {
  try {
    const token = req.cookies.token
  
    if(!token) return res.status(401).json({ error: "Request is not authorized" })
    
    const { _id } = jwt.verify(token, process.env.SECRET)

    await User.findOne({ _id }).select('_id')
    req.user = _id
    next()

  } catch (error) {
    console.log(error)
    res.status(401).json({error: 'Request is not authorized'})
  }
}

const getAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token
  
    if(!token) {
      req.user = null
      return next()
    }
    
    const { _id } = jwt.verify(token, process.env.SECRET)

    const user = await User.findOne({ _id }).select('_id')
    req.user = _id
    next()

  } catch (error) {
    console.log(error)
    req.user = null
    next()
  }
}

module.exports = { auth, getAuth };

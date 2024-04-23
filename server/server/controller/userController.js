const User = require('../models/userModel')
const jwt = require('jsonwebtoken')

const createToken = (_id, expiry) => {
  return jwt.sign({_id}, process.env.SECRET, { expiresIn: expiry })
}

// login a user
const loginUser = async (req, res) => {
  const {email, password, rememberPassword} = req.body

  try {
    console.log("in try for login")
    const user = await User.login(email, password)

    // create a token
    let token = createToken(user._id, '1d')
    if(rememberPassword) {
      token = createToken(user._id, '30d')
    }
    // send token cookie
    res.status(200).cookie("token", token, {
      httpOnly: true
    }).send()
  } catch (error) {
    res.status(400).json({error: error.message})
    console.log("error log")
  }
}

// signup a user
const signupUser = async (req, res) => {
  const {email, userName ,password} = req.body

  try {
    console.log("in try for signup")
    const user = await User.signup(email,userName, password)

    // create a token
    const token = createToken(user._id, '3d')

    // send token cookie
    res.status(200).cookie("token", token, {
      httpOnly: true
    }).send()
  } catch (error) {
    res.status(400).json({error: error.message})
    console.log("error")
  }
}

const logoutUser = async (req, res) => {
  console.log('logout user')
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0)
  }).send()
}

const loggedIn = async (req, res) => {
  try {
    const token = req.cookies.token
    if(!token) return res.json(false)

    jwt.verify(token, process.env.SECRET)
    
    res.send(true)
  } catch(error) {
    res.json(false)
  }
}

// a payement route that will be used to make payments wether to purchase credits, become host or ... "/payment"
// implement the payment process coming from the client side
const paymentProcess = async (req, res) => {
  console.log("in payment process");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  try {
    console.log("in try for payment");
    // implement the payment process
    // you can use a payment gateway like stripe, paypal, ...
    // or you can implement your own payment system
    // or just fake it for now
    res.status(200).json({ message: "Payment successful" });
  } catch (error) {
    res.status(400).json({ error: error.message });
    console.log("error");
  }
};

// become host route that updates isHost to true
const becomeHost = async (req, res) => {
 
  try {
    console.log("in try for become host");
    // find the user
    const user = await User.findById(req.user);
    console.log(user.isHost, "user.isHost")
    user.credits -=20;
    user.isHost = true;
    await user.save();

    res.status(200).json({ message: "Success" })
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const profile = async (req, res) => {
  const userUUID = req.user
  try {
    console.log("in try for profile");
    const user = await User.findById(userUUID)
    const returnData = {
      username: user.username,
      credits: user.credits,
    }
    res.status(200).json(returnData)
  } catch (error) {
    res.status(400).json({ error: 'User not found' });
    console.log("error");
  }
}

module.exports = { signupUser, loginUser, logoutUser, loggedIn, paymentProcess, becomeHost, profile }
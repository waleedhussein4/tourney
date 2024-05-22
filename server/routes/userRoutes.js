const express = require('express');
const {signupUser, loginUser, logoutUser, loggedIn, paymentProcess, becomeHost, profile, getisHost,subHostEarninhgs} = require('../controller/userController');
const router = express.Router();
const { auth } = require("../middleware/requireAuth")

//login route
router.post('/login', loginUser);

//sign up route
router.post('/signup', signupUser);

router.post('/logout', logoutUser);

router.get('/loggedin', loggedIn)

// returns profile information
router.get('/profile', auth, profile)

//a payement route that will be used to make payments wether to purchase credits, become host or ...
router.post("/payment", paymentProcess);

// become host route that updates isHost to true
router.post("/becomehost", auth, becomeHost);

router.get('/isHost', auth, getisHost);

router.post('/removeEarn',auth,subHostEarninhgs)

module.exports = router;
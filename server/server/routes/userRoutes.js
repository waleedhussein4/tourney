const express = require('express');
const {signupUser, loginUser, logoutUser, loggedIn, paymentProcess,
    becomeHost,} = require('../controller/userController');
const router = express.Router();

//login route
router.post('/login', loginUser);

//sign up route
router.post('/signup', signupUser);

router.post('/logout', logoutUser);

router.get('/loggedin', loggedIn)

//a payement route that will be used to make payments wether to purchase credits, become host or ...
router.post("/payment", paymentProcess);

// become host route that updates isHost to true
router.patch("/becomehost", becomeHost);

module.exports = router;
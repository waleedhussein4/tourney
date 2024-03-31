const express = require('express');
const {signupUser, loginUser, logoutUser, loggedIn} = require('../controller/userController');
const router = express.Router();

//login route
router.post('/login', loginUser);

//sign up route
router.post('/signup', signupUser);

router.post('/logout', logoutUser);

router.get('/loggedin', loggedIn)

module.exports = router;
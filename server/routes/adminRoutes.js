const express = require('express');
const { createTournaments, deleteAllTournaments } = require('../scripts/generateTestTournaments');
const { createUsers, deleteUsers } = require('../scripts/generateTestUsers');
const router = express();
const { admin } = require("../middleware/requireAuth")


// create test touranments
router.post('/createTournaments', admin, createTournaments);

// delete all tournaments
router.delete('/deleteAllTournaments', admin, deleteAllTournaments);

// create test users
router.post('/createUsers', admin, createUsers);

// delete users
router.delete('/deleteUsers', admin, deleteUsers);

module.exports = router;

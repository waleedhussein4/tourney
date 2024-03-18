const express = require('express');
const {createTournament, getTournamentById, getAllTournaments, updateTournament, deleteTournament} = require('../controller/tourneyController');
const router = express();

//tournaments
router.get('/', getAllTournaments);

//new tourney
router.post('/', createTournament);

//delete
router.delete('/',deleteTournament);

//update
router.patch('/',updateTournament);

module.exports = router;